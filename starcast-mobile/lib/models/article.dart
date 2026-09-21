class Article {
  final String id;
  final String slug;
  final String title;
  final String? subtitle;
  final String? excerpt;
  final String? content;
  final String authorName;
  final String? thumbnailUrl;
  final List<String> tags;
  final DateTime createdAt;

  Article({
    required this.id,
    required this.slug,
    required this.title,
    this.subtitle,
    this.excerpt,
    this.content,
    required this.authorName,
    this.thumbnailUrl,
    this.tags = const [],
    required this.createdAt,
  });

  factory Article.fromJson(Map<String, dynamic> json) {
    String author = 'StarCast Editorial';
    if (json['authorFirstName'] != null) {
      author = '${json['authorFirstName']} ${json['authorLastName'] ?? ''}'.trim();
    } else if (json['author'] is String) {
      author = json['author'];
    }

    List<String> parsedTags = [];
    if (json['tags'] is List) {
      parsedTags = (json['tags'] as List).map((e) => e.toString()).toList();
    }

    String? thumb = json['thumbnailUrl'] as String?;
    if (thumb == null && json['images'] is List && (json['images'] as List).isNotEmpty) {
      final firstImg = (json['images'] as List)[0];
      if (firstImg is Map && firstImg['url'] != null) {
        thumb = firstImg['url'].toString();
      }
    }

    // Fix relative image urls from backend
    if (thumb != null && thumb.startsWith('/')) {
      thumb = 'https://starcast.online$thumb';
    }

    return Article(
      id: json['id']?.toString() ?? '',
      slug: json['slug']?.toString() ?? json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'StarCast Dispatch',
      subtitle: json['subtitle']?.toString(),
      excerpt: json['excerpt']?.toString() ?? json['summary']?.toString(),
      content: json['content']?.toString(),
      authorName: author,
      thumbnailUrl: thumb,
      tags: parsedTags,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}
