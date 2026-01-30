from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import (
    Campaign,
    Session,
    DMNote,
    Class,
    CharacterSheet,
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
    characters = serializers.PrimaryKeyRelatedField(
        queryset=CharacterSheet.objects.all(),
        many=True,
        required=False,
    )
    characters_detail = serializers.SerializerMethodField()

    class Meta:
        model = Campaign
        fields = ('id', 'name', 'description', 'world_story', 'characters', 'characters_detail')

    def get_characters_detail(self, obj):
        return [
            {
                "id": character.id,
                "name": character.name,
                "character_class_name": character.character_class.name,
                "level": character.level,
            }
            for character in obj.characters.select_related("character_class").all()
        ]


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
    character_class_name = serializers.CharField(source='character_class.name', read_only=True)

    class Meta:
        model = CharacterSheet
        fields = (
            'id',
            'name',
            'character_class',
            'character_class_name',
            'level',
            'race',
            'background',
            'strength',
            'dexterity',
            'constitution',
            'intelligence',
            'wisdom',
            'charisma',
            'max_hit_points',
            'current_hit_points',
            'armor_class',
            'speed',
            'inspiration',
            'skills',
            'equipment',
            'spells',
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
