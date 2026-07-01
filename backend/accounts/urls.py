from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView, UserDetailView,
    AttendanceListCreateView, LeaveRequestListCreateView, LeaveRequestAdminUpdateView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', UserDetailView.as_view(), name='user_detail'),
    path('attendance/', AttendanceListCreateView.as_view(), name='attendance-list-create'),
    path('leaves/', LeaveRequestListCreateView.as_view(), name='leaves-list-create'),
    path('leaves/<int:pk>/', LeaveRequestAdminUpdateView.as_view(), name='leaves-admin-update'),
]

