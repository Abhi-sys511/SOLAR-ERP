from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()
from .models import Attendance, LeaveRequest


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            role=validated_data.get('role', 'CUSTOMER'),
            password=validated_data['password']
        )
        return user


class UserMinSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role')


class AttendanceSerializer(serializers.ModelSerializer):
    user_details = UserMinSerializer(source='user', read_only=True)

    class Meta:
        model = Attendance
        fields = ('id', 'user', 'user_details', 'date', 'timestamp')
        read_only_fields = ('user', 'date', 'timestamp')


class LeaveRequestSerializer(serializers.ModelSerializer):
    user_details = UserMinSerializer(source='user', read_only=True)

    class Meta:
        model = LeaveRequest
        fields = ('id', 'user', 'user_details', 'start_date', 'end_date', 'leave_type', 'reason', 'status', 'admin_remarks', 'created_at')
        read_only_fields = ('user', 'created_at')

