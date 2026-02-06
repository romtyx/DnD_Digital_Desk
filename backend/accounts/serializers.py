from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import (
    Campaign,
    Session,
    DMNote,
    Class,
    CharacterSheet,
    CampaignJoinRequest,
    CampaignNote,
    Storyline,
    StoryOutcome,
    ChatMessage,
)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        label="Confirm Password"
    )
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2')
        extra_kwargs = {
            'username': {'required': True},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'date_joined')


class CampaignSerializer(serializers.ModelSerializer):
    owner = serializers.PrimaryKeyRelatedField(read_only=True)
    owner_name = serializers.CharField(source="owner.username", read_only=True)
    join_code = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()
    players = serializers.SerializerMethodField()
    players_count = serializers.SerializerMethodField()
    pending_requests_count = serializers.SerializerMethodField()
    my_request_status = serializers.SerializerMethodField()

    class Meta:
        model = Campaign
        fields = (
            'id',
            'name',
            'description',
            'world_story',
            'is_public',
            'max_players',
            'join_code',
            'is_archived',
            'owner',
            'owner_name',
            'is_owner',
            'players',
            'players_count',
            'pending_requests_count',
            'my_request_status',
        )
        read_only_fields = (
            'join_code',
            'owner',
            'owner_name',
            'is_owner',
            'players',
            'players_count',
            'pending_requests_count',
            'my_request_status',
        )

    def validate(self, attrs):
        max_players = attrs.get("max_players")
        if max_players is not None and max_players < 1:
            raise serializers.ValidationError({"max_players": "Минимум 1 игрок"})

        instance = self.instance
        if instance is not None:
            accepted_count = instance.join_requests.filter(
                status=CampaignJoinRequest.Status.ACCEPTED
            ).count()
            next_max = max_players if max_players is not None else instance.max_players
            if next_max < accepted_count:
                raise serializers.ValidationError(
                    {"max_players": "Нельзя установить меньше, чем принятых игроков"}
                )
        return attrs

    def get_is_owner(self, obj):
        request = self.context.get("request")
        return bool(request and request.user.is_authenticated and obj.owner_id == request.user.id)

    def get_join_code(self, obj):
        if self.get_is_owner(obj):
            return obj.join_code
        return None

    def _get_requests(self, obj):
        return getattr(obj, "_prefetched_objects_cache", {}).get("join_requests") or obj.join_requests.all()

    def get_players(self, obj):
        accepted = [
            req
            for req in self._get_requests(obj)
            if req.status == CampaignJoinRequest.Status.ACCEPTED
        ]
        return [
            {
                "id": req.user_id,
                "username": getattr(req.user, "username", ""),
                "character_id": req.character_id,
                "character_name": getattr(req.character, "name", ""),
                "character_class_name": getattr(getattr(req.character, "character_class", None), "name", ""),
                "level": getattr(req.character, "level", None),
            }
            for req in accepted
        ]

    def get_players_count(self, obj):
        return sum(
            1
            for req in self._get_requests(obj)
            if req.status == CampaignJoinRequest.Status.ACCEPTED
        )

    def get_pending_requests_count(self, obj):
        if not self.get_is_owner(obj):
            return 0
        return sum(
            1
            for req in self._get_requests(obj)
            if req.status == CampaignJoinRequest.Status.PENDING
        )

    def get_my_request_status(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        if obj.owner_id == request.user.id:
            return None
        for req in self._get_requests(obj):
            if req.user_id == request.user.id:
                return req.status
        return None


class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = ('id', 'number', 'date', 'description', 'campaign')


class DMNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = DMNote
        fields = ('id', 'text', 'session')


class ClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = Class
        fields = ('id', 'name', 'hit_die')


class CharacterSheetSerializer(serializers.ModelSerializer):
    character_class = serializers.PrimaryKeyRelatedField(
        queryset=Class.objects.all(),
        required=False,
    )
    character_class_name = serializers.CharField(source='character_class.name', read_only=True)
    character_class_text = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
    )

    class Meta:
        model = CharacterSheet
        fields = (
            'id',
            'owner',
            'name',
            'player_name',
            'character_class',
            'character_class_text',
            'character_class_name',
            'level',
            'race',
            'background',
            'alignment',
            'experience_points',
            'strength',
            'strength_mod',
            'dexterity',
            'dexterity_mod',
            'constitution',
            'constitution_mod',
            'intelligence',
            'intelligence_mod',
            'wisdom',
            'wisdom_mod',
            'charisma',
            'charisma_mod',
            'saving_throw_strength',
            'saving_throw_strength_prof',
            'saving_throw_dexterity',
            'saving_throw_dexterity_prof',
            'saving_throw_constitution',
            'saving_throw_constitution_prof',
            'saving_throw_intelligence',
            'saving_throw_intelligence_prof',
            'saving_throw_wisdom',
            'saving_throw_wisdom_prof',
            'saving_throw_charisma',
            'saving_throw_charisma_prof',
            'skill_acrobatics',
            'skill_acrobatics_prof',
            'skill_animal_handling',
            'skill_animal_handling_prof',
            'skill_arcana',
            'skill_arcana_prof',
            'skill_athletics',
            'skill_athletics_prof',
            'skill_deception',
            'skill_deception_prof',
            'skill_history',
            'skill_history_prof',
            'skill_insight',
            'skill_insight_prof',
            'skill_intimidation',
            'skill_intimidation_prof',
            'skill_investigation',
            'skill_investigation_prof',
            'skill_medicine',
            'skill_medicine_prof',
            'skill_nature',
            'skill_nature_prof',
            'skill_perception',
            'skill_perception_prof',
            'skill_performance',
            'skill_performance_prof',
            'skill_persuasion',
            'skill_persuasion_prof',
            'skill_religion',
            'skill_religion_prof',
            'skill_sleight_of_hand',
            'skill_sleight_of_hand_prof',
            'skill_stealth',
            'skill_stealth_prof',
            'skill_survival',
            'skill_survival_prof',
            'max_hit_points',
            'current_hit_points',
            'temporary_hit_points',
            'armor_class',
            'initiative',
            'speed',
            'inspiration',
            'proficiency_bonus',
            'passive_perception',
            'hit_dice_total',
            'hit_dice_used',
            'hit_dice_type',
            'death_save_successes',
            'death_save_failures',
            'skills',
            'equipment',
            'treasure',
            'attacks',
            'attacks_and_spells',
            'other_proficiencies',
            'personality_traits',
            'ideals',
            'bonds',
            'flaws',
            'features_traits',
            'age',
            'height',
            'weight',
            'eyes',
            'skin',
            'hair',
            'appearance',
            'appearance_image',
            'symbol_image',
            'backstory',
            'allies_organizations',
            'additional_features',
            'spellcasting_class',
            'spellcasting_ability',
            'spell_save_dc',
            'spell_attack_bonus',
            'spells_cantrips',
            'spells',
            'spell_slots_1_total',
            'spell_slots_1_used',
            'spells_level_1',
            'spell_slots_2_total',
            'spell_slots_2_used',
            'spells_level_2',
            'spell_slots_3_total',
            'spell_slots_3_used',
            'spells_level_3',
            'spell_slots_4_total',
            'spell_slots_4_used',
            'spells_level_4',
            'spell_slots_5_total',
            'spell_slots_5_used',
            'spells_level_5',
            'spell_slots_6_total',
            'spell_slots_6_used',
            'spells_level_6',
            'spell_slots_7_total',
            'spell_slots_7_used',
            'spells_level_7',
            'spell_slots_8_total',
            'spell_slots_8_used',
            'spells_level_8',
            'spell_slots_9_total',
            'spell_slots_9_used',
            'spells_level_9',
        )
        read_only_fields = ('owner',)

    def _resolve_class(self, value: str | None) -> Class | None:
        if not value:
            return None
        name = value.strip()
        if not name:
            return None
        class_obj, _ = Class.objects.get_or_create(name=name)
        return class_obj

    def validate(self, attrs):
        if not attrs.get("character_class") and not attrs.get("character_class_text") and self.instance is None:
            raise serializers.ValidationError({"character_class_text": "Укажите класс персонажа"})
        return attrs

    def create(self, validated_data):
        text = validated_data.pop("character_class_text", None)
        if text:
            validated_data["character_class"] = self._resolve_class(text)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        text = validated_data.pop("character_class_text", None)
        if text is not None:
            resolved = self._resolve_class(text)
            if resolved:
                validated_data["character_class"] = resolved
        return super().update(instance, validated_data)


class CampaignJoinRequestSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.username", read_only=True)
    campaign_name = serializers.CharField(source="campaign.name", read_only=True)
    campaign_owner_name = serializers.CharField(source="campaign.owner.username", read_only=True)
    character_name = serializers.CharField(source="character.name", read_only=True)
    character_class_name = serializers.CharField(source="character.character_class.name", read_only=True)

    class Meta:
        model = CampaignJoinRequest
        fields = (
            "id",
            "campaign",
            "campaign_name",
            "campaign_owner_name",
            "user",
            "user_name",
            "character",
            "character_name",
            "character_class_name",
            "status",
            "created_at",
            "decided_at",
        )
        read_only_fields = (
            "user",
            "status",
            "created_at",
            "decided_at",
            "campaign_name",
            "campaign_owner_name",
            "user_name",
            "character_name",
            "character_class_name",
        )


class CampaignNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampaignNote
        fields = ('id', 'text', 'campaign', 'created_at')


class StorylineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Storyline
        fields = ('id', 'title', 'summary', 'order', 'campaign')


class StoryOutcomeSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoryOutcome
        fields = ('id', 'title', 'condition', 'description', 'order', 'storyline')


class ChatMessageSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = ChatMessage
        fields = ('id', 'text', 'campaign', 'user', 'user_name', 'created_at')
        read_only_fields = ('user', 'user_name', 'created_at')
