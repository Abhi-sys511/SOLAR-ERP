from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.utils import timezone
from .serializers import UserSerializer, AttendanceSerializer, LeaveRequestSerializer
from .models import Attendance, LeaveRequest
from django.contrib.auth import get_user_model

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserSerializer

class UserDetailView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user


class AttendanceListCreateView(generics.ListCreateAPIView):
    serializer_class = AttendanceSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', None) == 'ADMIN':
            return Attendance.objects.all()
        return Attendance.objects.filter(user=user)

    def perform_create(self, serializer):
        user = self.request.user
        today = timezone.now().date()
        if Attendance.objects.filter(user=user, date=today).exists():
            raise ValidationError("Attendance already marked for today.")
        serializer.save(user=user)


class LeaveRequestListCreateView(generics.ListCreateAPIView):
    serializer_class = LeaveRequestSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', None) == 'ADMIN':
            return LeaveRequest.objects.all()
        return LeaveRequest.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, status='PENDING')


class LeaveRequestAdminUpdateView(generics.UpdateAPIView):
    queryset = LeaveRequest.objects.all()
    serializer_class = LeaveRequestSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def perform_update(self, serializer):
        if getattr(self.request.user, 'role', None) != 'ADMIN':
            raise PermissionDenied("Only administrators can update leave request status.")
        serializer.save()

