class CommunityPost {
  final String id;
  final String title;
  final String content;
  final String authorName;
  final String? authorAvatar;
  final String category;
  final int repliesCount;
  final int likesCount;
  final DateTime createdAt;

  CommunityPost({
    required this.id,
    required this.title,
    required this.content,
    required this.authorName,
    this.authorAvatar,
    this.category = 'The DECK',
    this.repliesCount = 0,
    this.likesCount = 0,
    required this.createdAt,
  });

  factory CommunityPost.fromJson(Map<String, dynamic> json) {
    String author = 'Community Member';
    String? avatar;
    if (json['employee'] is Map) {
      final emp = json['employee'];
      author = '${emp['first_name'] ?? ''} ${emp['last_name'] ?? ''}'.trim();
      avatar = emp['avatar_url'] ?? emp['photo_url'];
    } else if (json['author'] is String) {
      author = json['author'];
    }

    final rawContent = json['content']?.toString() ?? '';
    final rawTitle = json['title']?.toString() ??
        (rawContent.length > 60 ? '${rawContent.substring(0, 60)}...' : rawContent);

    return CommunityPost(
      id: json['id']?.toString() ?? '',
      title: rawTitle.isEmpty ? 'Discussion Topic' : rawTitle,
      content: rawContent,
      authorName: author.isEmpty ? 'StarCast Contributor' : author,
      authorAvatar: avatar,
      category: json['category']?.toString() ?? 'The DECK',
      repliesCount: (json['comments'] is List)
          ? (json['comments'] as List).length
          : int.tryParse(json['replies']?.toString() ?? '0') ?? 0,
      likesCount: int.tryParse(json['likes']?.toString() ?? '0') ?? 0,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}
