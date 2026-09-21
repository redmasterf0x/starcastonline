import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/article.dart';
import '../models/show.dart';
import '../models/community_post.dart';

class StarCastApiService {
  static const String baseUrl = 'https://starcast.online';

  /// Fetch latest articles feed
  static Future<List<Article>> fetchArticles() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/articles'),
        headers: {'Accept': 'application/json'},
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final list = (data is List) ? data : (data['articles'] as List? ?? []);
        return list.map((item) => Article.fromJson(item)).toList();
      }
    } catch (e) {
      // Fallback sample data if offline
    }

    return _fallbackArticles;
  }

  /// Fetch single article by slug
  static Future<Article?> fetchArticleBySlug(String slug) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/articles/$slug'),
        headers: {'Accept': 'application/json'},
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return Article.fromJson(data);
      }
    } catch (e) {
      // Return matching from fallback
    }

    return _fallbackArticles.firstWhere(
      (a) => a.slug == slug || a.id == slug,
      orElse: () => _fallbackArticles.first,
    );
  }

  /// Fetch community DECK discussions
  static Future<List<CommunityPost>> fetchCommunityPosts() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/community'),
        headers: {'Accept': 'application/json'},
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final list = (data is List) ? data : (data['posts'] as List? ?? []);
        return list.map((item) => CommunityPost.fromJson(item)).toList();
      }
    } catch (e) {
      // Fallback sample data
    }

    return _fallbackCommunityPosts;
  }

  /// Post a new discussion topic to The DECK
  static Future<bool> createCommunityPost({
    required String title,
    required String content,
    required String category,
    required String authorName,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/community'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'title': title,
          'content': content,
          'category': category,
          'author': authorName,
        }),
      ).timeout(const Duration(seconds: 10));

      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      return false;
    }
  }

  /// High-quality Fallback Articles for offline / initial loads
  static final List<Article> _fallbackArticles = [
    Article(
      id: 'ray-starnes-a-who-s-who-in-topeka-how-starcast-media-built-the-ultimate-local-talent-spotlight',
      slug: 'ray-starnes-a-who-s-who-in-topeka-how-starcast-media-built-the-ultimate-local-talent-spotlight',
      title: 'A Who’s Who in Topeka: How StarCast Media Built the Ultimate Local Talent Spotlight',
      subtitle: 'From underground musicians to community trailblazers, StarCast is putting Midwest creators on the global radar.',
      excerpt: 'StarCast Media is Topeka’s premier broadcasting company, revolutionizing independent live audio/video and elevating local cultural voices.',
      content: '''
StarCast Media has become the epicenter of local cultural broadcasting in Topeka, Kansas. 

Through groundbreaking original series like The Observation Deck, Star Talk, Hollywood After Babylon, and The Psyco G Spot, StarCast is providing a high-definition platform for musicians, artists, independent filmmakers, and entrepreneurs across the Midwest.

Our dedicated soundstage and digital network reach thousands of daily listeners and viewers, proving that community-driven storytelling has unparalleled power.
      ''',
      authorName: 'Ray Starnes',
      thumbnailUrl: 'https://starcast.online/api/blobs/articles/1789706813420-813698664_122179551476989366_707270621950863051_n.jpg',
      tags: ['Topeka', 'Spotlight', 'Music', 'Media'],
      createdAt: DateTime.now().subtract(const Duration(days: 4)),
    ),
    Article(
      id: 'soundstage-spotlight-the-midwest-sound-revival',
      slug: 'soundstage-spotlight-the-midwest-sound-revival',
      title: 'Soundstage Spotlight: The Midwest Sound Revival',
      subtitle: 'Inside the recording sessions capturing Heartland rock, hip-hop, and indie acoustics.',
      excerpt: 'Explore how StarCast’s state-of-the-art studio sessions bring raw live energy straight to your headphones.',
      content: 'Independent bands from across the region gather at the StarCast Soundstage to record live sessions and exclusive interviews.',
      authorName: 'StarCast Editorial',
      tags: ['Soundstage', 'Live Music', 'Production'],
      createdAt: DateTime.now().subtract(const Duration(days: 6)),
    ),
  ];

  /// Fallback Community Discussions
  static final List<CommunityPost> _fallbackCommunityPosts = [
    CommunityPost(
      id: 'post_1',
      title: 'Who is tuning in for the live Observation Deck premiere this Friday?',
      content: 'Dropping an exclusive interview with local musicians and special guests. Leave your questions below for the Q&A!',
      authorName: 'StarCast Official',
      category: 'The DECK',
      repliesCount: 14,
      likesCount: 38,
      createdAt: DateTime.now().subtract(const Duration(hours: 3)),
    ),
    CommunityPost(
      id: 'post_2',
      title: 'Favorite Star Talk episode so far?',
      content: 'Between the athlete spotlights and the indie filmmakers, what has been your favorite takeaway this season?',
      authorName: 'Marcus T.',
      category: 'Discussion',
      repliesCount: 9,
      likesCount: 22,
      createdAt: DateTime.now().subtract(const Duration(days: 1)),
    ),
  ];
}
