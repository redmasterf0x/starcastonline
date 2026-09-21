class StarCastUser {
  final String id;
  final String name;
  final String? email;
  final String? phone;
  final String? avatarUrl;
  final String role;
  final String membershipTier;
  final DateTime joinedAt;

  StarCastUser({
    required this.id,
    required this.name,
    this.email,
    this.phone,
    this.avatarUrl,
    this.role = 'Member',
    this.membershipTier = 'StarCast Pass',
    DateTime? joinedAt,
  }) : joinedAt = joinedAt ?? DateTime.now();

  factory StarCastUser.fromJson(Map<String, dynamic> json) {
    return StarCastUser(
      id: json['id'] as String? ?? 'user_${DateTime.now().millisecondsSinceEpoch}',
      name: json['name'] as String? ?? 'StarCast Member',
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      avatarUrl: json['avatarUrl'] as String? ?? json['image'] as String?,
      role: json['role'] as String? ?? 'Member',
      membershipTier: json['membershipTier'] as String? ?? 'StarCast Community Pass',
      joinedAt: json['joinedAt'] != null
          ? DateTime.tryParse(json['joinedAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'avatarUrl': avatarUrl,
      'role': role,
      'membershipTier': membershipTier,
      'joinedAt': joinedAt.toIso8601String(),
    };
  }
}
