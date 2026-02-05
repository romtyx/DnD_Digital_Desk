from rest_framework import status, generics, permissions, viewsets
from rest_framework.parsers import FormParser, MultiPartParser, JSONParser
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Q
from django.utils import timezone
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    CampaignSerializer,
    SessionSerializer,
    DMNoteSerializer,
    ClassSerializer,
    CharacterSheetSerializer,
    CampaignNoteSerializer,
    StorylineSerializer,
    StoryOutcomeSerializer,
    ChatMessageSerializer,
    CampaignJoinRequestSerializer,
)
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
    CampaignJoinRequest,
)


def owner_or_player_q(user, prefix: str = "campaign") -> Q:
    if not user or not user.is_authenticated:
        return Q(pk__in=[])
    return Q(**{f"{prefix}__owner": user}) | Q(
        **{
            f"{prefix}__join_requests__user": user,
            f"{prefix}__join_requests__status": CampaignJoinRequest.Status.ACCEPTED,
        }
    )


def owner_only_q(user, prefix: str = "campaign") -> Q:
    if not user or not user.is_authenticated:
        return Q(pk__in=[])
    return Q(**{f"{prefix}__owner": user})


class RegisterView(generics.CreateAPIView):
    """
    Register a new user.
    """
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'message': 'User registered successfully'
        }, status=status.HTTP_201_CREATED)


class LoginView(generics.GenericAPIView):
    """
    Login and get JWT tokens.
    """
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {'error': 'Username and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(username=username, password=password)
        
        if user is None:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'message': 'Login successful'
        }, status=status.HTTP_200_OK)


class LogoutView(generics.GenericAPIView):
    """
    Logout and optionally blacklist refresh token.
    """
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                try:
                    token = RefreshToken(refresh_token)
                    # Try to blacklist if blacklist app is configured
                    token.blacklist()
                except AttributeError:
                    # Blacklist not configured, just return success
                    pass
            return Response(
                {'message': 'Logout successful'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': 'Invalid token'},
                status=status.HTTP_400_BAD_REQUEST
            )


class UserDetailView(generics.RetrieveUpdateAPIView):
    """
    Get or update current user details.
    """
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.UpdateAPIView):
    """
    Change user password.
    """
    permission_classes = (permissions.IsAuthenticated,)

    def update(self, request, *args, **kwargs):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not old_password or not new_password:
            return Response(
                {'error': 'Old password and new password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user.check_password(old_password):
            return Response(
                {'error': 'Invalid old password'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        return Response(
            {'message': 'Password changed successfully'},
            status=status.HTTP_200_OK
        )


class UserListView(generics.ListAPIView):
    """
    List all users (for testing/admin purposes).
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)


class CampaignViewSet(viewsets.ModelViewSet):
    queryset = Campaign.objects.select_related("owner").all()
    serializer_class = CampaignSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        qs = (
            Campaign.objects.select_related("owner")
            .prefetch_related("join_requests__user", "join_requests__character__character_class")
            .order_by("id")
        )
        if not self.request.user.is_authenticated:
            return qs.none()
        return (
            qs.filter(
                Q(owner=self.request.user)
                | Q(
                    join_requests__user=self.request.user,
                    join_requests__status=CampaignJoinRequest.Status.ACCEPTED,
                )
            )
            .distinct()
        )

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def _assert_owner(self, campaign: Campaign):
        if campaign.owner_id != self.request.user.id:
            raise PermissionDenied("Можно редактировать только свои кампании.")

    def update(self, request, *args, **kwargs):
        campaign = self.get_object()
        self._assert_owner(campaign)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        campaign = self.get_object()
        self._assert_owner(campaign)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        campaign = self.get_object()
        self._assert_owner(campaign)
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=["get"], permission_classes=[permissions.AllowAny])
    def public(self, request):
        qs = (
            Campaign.objects.select_related("owner")
            .prefetch_related("join_requests__user", "join_requests__character__character_class")
            .filter(is_public=True, is_archived=False)
            .order_by("name", "id")
        )
        query = request.query_params.get("q")
        if query:
            qs = qs.filter(
                Q(name__icontains=query)
                | Q(description__icontains=query)
                | Q(world_story__icontains=query)
            )
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


class CampaignJoinRequestViewSet(viewsets.ModelViewSet):
    serializer_class = CampaignJoinRequestSerializer
    permission_classes = (permissions.IsAuthenticated,)
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        queryset = (
            CampaignJoinRequest.objects.select_related(
                "campaign",
                "campaign__owner",
                "user",
                "character",
                "character__character_class",
            )
            .all()
            .order_by("-created_at")
        )
        if self.action in {"approve", "reject"}:
            return queryset.filter(campaign__owner=self.request.user)
        scope = self.request.query_params.get("scope", "outgoing")
        if scope == "incoming":
            queryset = queryset.filter(campaign__owner=self.request.user)
        else:
            queryset = queryset.filter(user=self.request.user)
        campaign_id = self.request.query_params.get("campaign")
        if campaign_id:
            queryset = queryset.filter(campaign_id=campaign_id)
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

    def create(self, request, *args, **kwargs):
        campaign_id = request.data.get("campaign")
        code = request.data.get("code")
        character_id = request.data.get("character")

        if not character_id:
            raise ValidationError({"character": "Выберите персонажа"})
        if not campaign_id and not code:
            raise ValidationError({"campaign": "Нужна кампания или код"})

        if campaign_id:
            try:
                campaign = Campaign.objects.select_related("owner").get(id=campaign_id)
            except Campaign.DoesNotExist:
                raise ValidationError({"campaign": "Кампания не найдена"})
        else:
            try:
                campaign = Campaign.objects.select_related("owner").get(join_code=code)
            except Campaign.DoesNotExist:
                raise ValidationError({"code": "Неверный код кампании"})

        if campaign.is_archived:
            raise ValidationError({"campaign": "Кампания в архиве"})
        if campaign.owner_id == request.user.id:
            raise ValidationError({"campaign": "Вы уже мастер этой кампании"})
        if not campaign.is_public and campaign.join_code != code:
            raise ValidationError({"code": "Неверный код кампании"})

        if CampaignJoinRequest.objects.filter(campaign=campaign, user=request.user).exists():
            raise ValidationError({"campaign": "Заявка уже отправлена"})

        try:
            character = CharacterSheet.objects.get(id=character_id, owner=request.user)
        except CharacterSheet.DoesNotExist:
            raise ValidationError({"character": "Персонаж не найден"})

        accepted_count = CampaignJoinRequest.objects.filter(
            campaign=campaign,
            status=CampaignJoinRequest.Status.ACCEPTED,
        ).count()
        if accepted_count >= campaign.max_players:
            raise ValidationError({"campaign": "Кампания уже заполнена"})

        join_request = CampaignJoinRequest.objects.create(
            campaign=campaign,
            user=request.user,
            character=character,
            status=CampaignJoinRequest.Status.PENDING,
        )
        serializer = self.get_serializer(join_request)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        join_request = self.get_object()
        campaign = join_request.campaign
        if campaign.owner_id != request.user.id:
            raise PermissionDenied("Только мастер может принимать заявки.")
        if join_request.status != CampaignJoinRequest.Status.PENDING:
            raise ValidationError({"status": "Заявка уже обработана"})
        if campaign.is_archived:
            raise ValidationError({"campaign": "Кампания в архиве"})

        accepted_count = CampaignJoinRequest.objects.filter(
            campaign=campaign,
            status=CampaignJoinRequest.Status.ACCEPTED,
        ).count()
        if accepted_count >= campaign.max_players:
            raise ValidationError({"campaign": "Кампания уже заполнена"})

        join_request.status = CampaignJoinRequest.Status.ACCEPTED
        join_request.decided_at = timezone.now()
        join_request.save(update_fields=["status", "decided_at"])

        accepted_count += 1
        if accepted_count >= campaign.max_players:
            CampaignJoinRequest.objects.filter(
                campaign=campaign,
                status=CampaignJoinRequest.Status.PENDING,
            ).exclude(id=join_request.id).update(
                status=CampaignJoinRequest.Status.REJECTED,
                decided_at=timezone.now(),
            )

        serializer = self.get_serializer(join_request)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        join_request = self.get_object()
        campaign = join_request.campaign
        if campaign.owner_id != request.user.id:
            raise PermissionDenied("Только мастер может отклонять заявки.")
        if join_request.status != CampaignJoinRequest.Status.PENDING:
            raise ValidationError({"status": "Заявка уже обработана"})

        join_request.status = CampaignJoinRequest.Status.REJECTED
        join_request.decided_at = timezone.now()
        join_request.save(update_fields=["status", "decided_at"])

        serializer = self.get_serializer(join_request)
        return Response(serializer.data)


class SessionViewSet(viewsets.ModelViewSet):
    serializer_class = SessionSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        queryset = (
            Session.objects.select_related("campaign")
            .filter(owner_or_player_q(self.request.user, "campaign"))
            .distinct()
            .order_by("id")
        )
        campaign_id = self.request.query_params.get("campaign")
        if campaign_id:
            queryset = queryset.filter(campaign_id=campaign_id)
        return queryset

    def perform_create(self, serializer):
        campaign = serializer.validated_data["campaign"]
        if campaign.owner_id != self.request.user.id:
            raise PermissionDenied("Создавать сессии может только мастер.")
        if campaign.is_archived:
            raise ValidationError("Кампания в архиве.")
        serializer.save()

    def perform_update(self, serializer):
        campaign = serializer.validated_data.get("campaign", serializer.instance.campaign)
        if campaign.owner_id != self.request.user.id:
            raise PermissionDenied("Редактировать сессии может только мастер.")
        if campaign.is_archived:
            raise ValidationError("Кампания в архиве.")
        serializer.save()


class DMNoteViewSet(viewsets.ModelViewSet):
    serializer_class = DMNoteSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        queryset = (
            DMNote.objects.select_related("session", "session__campaign")
            .filter(owner_only_q(self.request.user, "session__campaign"))
            .distinct()
            .order_by("id")
        )
        session_id = self.request.query_params.get("session")
        if session_id:
            queryset = queryset.filter(session_id=session_id)
        return queryset

    def perform_create(self, serializer):
        session = serializer.validated_data["session"]
        campaign = session.campaign
        if campaign.owner_id != self.request.user.id:
            raise PermissionDenied("Заметки мастера доступны только владельцу кампании.")
        if campaign.is_archived:
            raise ValidationError("Кампания в архиве.")
        serializer.save()

    def perform_update(self, serializer):
        session = serializer.validated_data.get("session", serializer.instance.session)
        campaign = session.campaign
        if campaign.owner_id != self.request.user.id:
            raise PermissionDenied("Заметки мастера доступны только владельцу кампании.")
        if campaign.is_archived:
            raise ValidationError("Кампания в архиве.")
        serializer.save()


class ClassViewSet(viewsets.ModelViewSet):
    queryset = Class.objects.all().order_by("id")
    serializer_class = ClassSerializer
    permission_classes = (permissions.IsAuthenticated,)


class CharacterSheetViewSet(viewsets.ModelViewSet):
    queryset = CharacterSheet.objects.select_related("character_class").all().order_by("id")
    serializer_class = CharacterSheetSerializer
    permission_classes = (permissions.IsAuthenticated,)
    parser_classes = (JSONParser, FormParser, MultiPartParser)

    def get_queryset(self):
        return (
            CharacterSheet.objects.select_related("character_class")
            .filter(owner=self.request.user)
            .order_by("id")
        )

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class CampaignNoteViewSet(viewsets.ModelViewSet):
    serializer_class = CampaignNoteSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        queryset = (
            CampaignNote.objects.select_related("campaign")
            .filter(owner_only_q(self.request.user, "campaign"))
            .distinct()
            .order_by("-created_at")
        )
        campaign_id = self.request.query_params.get("campaign")
        if campaign_id:
            queryset = queryset.filter(campaign_id=campaign_id)
        return queryset

    def perform_create(self, serializer):
        campaign = serializer.validated_data["campaign"]
        if campaign.owner_id != self.request.user.id:
            raise PermissionDenied("Заметки кампании доступны только владельцу кампании.")
        if campaign.is_archived:
            raise ValidationError("Кампания в архиве.")
        serializer.save()

    def perform_update(self, serializer):
        campaign = serializer.validated_data.get("campaign", serializer.instance.campaign)
        if campaign.owner_id != self.request.user.id:
            raise PermissionDenied("Заметки кампании доступны только владельцу кампании.")
        if campaign.is_archived:
            raise ValidationError("Кампания в архиве.")
        serializer.save()


class StorylineViewSet(viewsets.ModelViewSet):
    serializer_class = StorylineSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        queryset = (
            Storyline.objects.select_related("campaign")
            .filter(owner_only_q(self.request.user, "campaign"))
            .distinct()
        )
        campaign_id = self.request.query_params.get("campaign")
        if campaign_id:
            queryset = queryset.filter(campaign_id=campaign_id)
        return queryset.order_by("order", "id")

    def perform_create(self, serializer):
        campaign = serializer.validated_data["campaign"]
        if campaign.owner_id != self.request.user.id:
            raise PermissionDenied("Линии сюжета доступны только владельцу кампании.")
        if campaign.is_archived:
            raise ValidationError("Кампания в архиве.")
        serializer.save()

    def perform_update(self, serializer):
        campaign = serializer.validated_data.get("campaign", serializer.instance.campaign)
        if campaign.owner_id != self.request.user.id:
            raise PermissionDenied("Линии сюжета доступны только владельцу кампании.")
        if campaign.is_archived:
            raise ValidationError("Кампания в архиве.")
        serializer.save()


class StoryOutcomeViewSet(viewsets.ModelViewSet):
    serializer_class = StoryOutcomeSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        queryset = (
            StoryOutcome.objects.select_related("storyline", "storyline__campaign")
            .filter(owner_only_q(self.request.user, "storyline__campaign"))
            .distinct()
        )
        storyline_id = self.request.query_params.get("storyline")
        if storyline_id:
            queryset = queryset.filter(storyline_id=storyline_id)
        return queryset.order_by("order", "id")

    def perform_create(self, serializer):
        storyline = serializer.validated_data["storyline"]
        campaign = storyline.campaign
        if campaign.owner_id != self.request.user.id:
            raise PermissionDenied("Исходы событий доступны только владельцу кампании.")
        if campaign.is_archived:
            raise ValidationError("Кампания в архиве.")
        serializer.save()

    def perform_update(self, serializer):
        storyline = serializer.validated_data.get("storyline", serializer.instance.storyline)
        campaign = storyline.campaign
        if campaign.owner_id != self.request.user.id:
            raise PermissionDenied("Исходы событий доступны только владельцу кампании.")
        if campaign.is_archived:
            raise ValidationError("Кампания в архиве.")
        serializer.save()


class ChatMessageViewSet(viewsets.ModelViewSet):
    serializer_class = ChatMessageSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        queryset = (
            ChatMessage.objects.select_related("user", "campaign")
            .filter(owner_or_player_q(self.request.user, "campaign"))
            .distinct()
        )
        campaign_id = self.request.query_params.get("campaign")
        if campaign_id:
            queryset = queryset.filter(campaign_id=campaign_id)
        return queryset.order_by("created_at", "id")

    def perform_create(self, serializer):
        campaign = serializer.validated_data["campaign"]
        is_owner = campaign.owner_id == self.request.user.id
        is_player = CampaignJoinRequest.objects.filter(
            campaign=campaign,
            user=self.request.user,
            status=CampaignJoinRequest.Status.ACCEPTED,
        ).exists()
        if not (is_owner or is_player):
            raise PermissionDenied("Вы не состоите в этой кампании.")
        if campaign.is_archived:
            raise ValidationError("Кампания в архиве.")
        serializer.save(user=self.request.user)
