from rest_framework import status, generics, permissions, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
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
)


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
    queryset = Campaign.objects.all().order_by("id")
    serializer_class = CampaignSerializer
    permission_classes = (permissions.IsAuthenticated,)


class SessionViewSet(viewsets.ModelViewSet):
    serializer_class = SessionSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        queryset = Session.objects.select_related("campaign").all().order_by("id")
        campaign_id = self.request.query_params.get("campaign")
        if campaign_id:
            queryset = queryset.filter(campaign_id=campaign_id)
        return queryset


class DMNoteViewSet(viewsets.ModelViewSet):
    serializer_class = DMNoteSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        queryset = DMNote.objects.select_related("session").all().order_by("id")
        session_id = self.request.query_params.get("session")
        if session_id:
            queryset = queryset.filter(session_id=session_id)
        return queryset


class ClassViewSet(viewsets.ModelViewSet):
    queryset = Class.objects.all().order_by("id")
    serializer_class = ClassSerializer
    permission_classes = (permissions.IsAuthenticated,)


class CharacterSheetViewSet(viewsets.ModelViewSet):
    queryset = CharacterSheet.objects.select_related("character_class").all().order_by("id")
    serializer_class = CharacterSheetSerializer
    permission_classes = (permissions.IsAuthenticated,)


class CampaignNoteViewSet(viewsets.ModelViewSet):
    serializer_class = CampaignNoteSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        queryset = CampaignNote.objects.select_related("campaign").all().order_by("-created_at")
        campaign_id = self.request.query_params.get("campaign")
        if campaign_id:
            queryset = queryset.filter(campaign_id=campaign_id)
        return queryset


class StorylineViewSet(viewsets.ModelViewSet):
    serializer_class = StorylineSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        queryset = Storyline.objects.select_related("campaign").all()
        campaign_id = self.request.query_params.get("campaign")
        if campaign_id:
            queryset = queryset.filter(campaign_id=campaign_id)
        return queryset.order_by("order", "id")


class StoryOutcomeViewSet(viewsets.ModelViewSet):
    serializer_class = StoryOutcomeSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        queryset = StoryOutcome.objects.select_related("storyline").all()
        storyline_id = self.request.query_params.get("storyline")
        if storyline_id:
            queryset = queryset.filter(storyline_id=storyline_id)
        return queryset.order_by("order", "id")


class ChatMessageViewSet(viewsets.ModelViewSet):
    serializer_class = ChatMessageSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        queryset = ChatMessage.objects.select_related("user", "campaign").all()
        campaign_id = self.request.query_params.get("campaign")
        if campaign_id:
            queryset = queryset.filter(campaign_id=campaign_id)
        return queryset.order_by("created_at", "id")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
