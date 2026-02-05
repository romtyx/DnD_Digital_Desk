from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    UserDetailView,
    ChangePasswordView,
    UserListView,
    CampaignViewSet,
    CampaignJoinRequestViewSet,
    SessionViewSet,
    DMNoteViewSet,
    ClassViewSet,
    CharacterSheetViewSet,
    CampaignNoteViewSet,
    StorylineViewSet,
    StoryOutcomeViewSet,
    ChatMessageViewSet,
)
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

router = DefaultRouter()
router.register(r'campaigns', CampaignViewSet, basename='campaign')
router.register(r'campaign-requests', CampaignJoinRequestViewSet, basename='campaign-request')
router.register(r'sessions', SessionViewSet, basename='session')
router.register(r'dm-notes', DMNoteViewSet, basename='dmnote')
router.register(r'classes', ClassViewSet, basename='class')
router.register(r'characters', CharacterSheetViewSet, basename='character')
router.register(r'campaign-notes', CampaignNoteViewSet, basename='campaign-note')
router.register(r'storylines', StorylineViewSet, basename='storyline')
router.register(r'story-outcomes', StoryOutcomeViewSet, basename='story-outcome')
router.register(r'chat-messages', ChatMessageViewSet, basename='chat-message')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', UserDetailView.as_view(), name='user_detail'),
    path('me/change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('users/', UserListView.as_view(), name='user_list'),
    path('', include(router.urls)),
]
