import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../core/theme.dart';
import '../core/api_service.dart';
import '../models/article.dart';
import 'article_detail_screen.dart';

class ArticlesScreen extends StatefulWidget {
  const ArticlesScreen({super.key});

  @override
  State<ArticlesScreen> createState() => _ArticlesScreenState();
}

class _ArticlesScreenState extends State<ArticlesScreen> {
  List<Article> _articles = [];
  bool _isLoading = true;
  String _selectedTag = 'All';

  final List<String> _filterTags = ['All', 'Topeka', 'Spotlight', 'Music', 'Media', 'Soundstage'];

  @override
  void initState() {
    super.initState();
    _loadArticles();
  }

  Future<void> _loadArticles() async {
    setState(() => _isLoading = true);
    final list = await StarCastApiService.fetchArticles();
    if (mounted) {
      setState(() {
        _articles = list;
        _isLoading = false;
      });
    }
  }

  List<Article> get _filteredArticles {
    if (_selectedTag == 'All') return _articles;
    return _articles.where((a) {
      return a.tags.any((t) => t.toLowerCase() == _selectedTag.toLowerCase()) ||
          a.title.toLowerCase().contains(_selectedTag.toLowerCase());
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filteredArticles;
    final latestArticle = filtered.isNotEmpty ? filtered.first : null;
    final secondaryArticles = filtered.length > 1 ? filtered.sublist(1) : <Article>[];

    return Scaffold(
      backgroundColor: StarCastTheme.deepSpace,
      appBar: AppBar(
        title: Row(
          children: const [
            Icon(Icons.article_rounded, color: StarCastTheme.emeraldGreen, size: 22),
            SizedBox(width: 8),
            Text('StarCast Dispatches'),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _loadArticles,
        color: StarCastTheme.sunsetOrange,
        backgroundColor: StarCastTheme.liftedPanel,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: StarCastTheme.sunsetOrange))
            : SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Tag Selector Chips
                    SizedBox(
                      height: 38,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: _filterTags.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 8),
                        itemBuilder: (context, index) {
                          final tag = _filterTags[index];
                          final isSelected = tag == _selectedTag;
                          return ChoiceChip(
                            label: Text(tag),
                            selected: isSelected,
                            onSelected: (_) => setState(() => _selectedTag = tag),
                            selectedColor: StarCastTheme.emeraldGreen.withOpacity(0.2),
                            backgroundColor: StarCastTheme.liftedPanel,
                            side: BorderSide(
                              color: isSelected ? StarCastTheme.emeraldGreen : StarCastTheme.subtleBorder,
                            ),
                            labelStyle: TextStyle(
                              color: isSelected ? StarCastTheme.emeraldGreen : StarCastTheme.textMuted,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                              fontSize: 12,
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 20),

                    // LATEST ARTICLE SPOTLIGHT HERO CARD (At top)
                    if (latestArticle != null) ...[
                      Row(
                        children: const [
                          Icon(Icons.local_fire_department_rounded, color: StarCastTheme.sunsetOrange, size: 18),
                          SizedBox(width: 6),
                          Text(
                            'LATEST TOP STORY',
                            style: TextStyle(
                              color: StarCastTheme.amberGold,
                              fontSize: 11,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1.2,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),

                      InkWell(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => ArticleDetailScreen(article: latestArticle),
                            ),
                          );
                        },
                        borderRadius: BorderRadius.circular(20),
                        child: Container(
                          decoration: BoxDecoration(
                            color: StarCastTheme.liftedPanel,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: StarCastTheme.emeraldGreen.withOpacity(0.7)),
                            boxShadow: [
                              BoxShadow(
                                color: StarCastTheme.emeraldGreen.withOpacity(0.15),
                                blurRadius: 24,
                                offset: const Offset(0, 8),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Hero Cover Image
                              if (latestArticle.thumbnailUrl != null)
                                ClipRRect(
                                  borderRadius: const BorderRadius.vertical(top: Radius.circular(19)),
                                  child: AspectRatio(
                                    aspectRatio: 16 / 9,
                                    child: CachedNetworkImage(
                                      imageUrl: latestArticle.thumbnailUrl!,
                                      fit: BoxFit.cover,
                                      placeholder: (context, url) => Container(
                                        color: StarCastTheme.baseNavy,
                                        child: const Center(
                                          child: CircularProgressIndicator(color: StarCastTheme.emeraldGreen),
                                        ),
                                      ),
                                      errorWidget: (context, url, error) => Container(
                                        color: StarCastTheme.baseNavy,
                                        child: const Icon(Icons.article, color: StarCastTheme.textMuted),
                                      ),
                                    ),
                                  ),
                                ),

                              // Content details
                              Padding(
                                padding: const EdgeInsets.all(20),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Text(
                                          latestArticle.authorName,
                                          style: const TextStyle(
                                            color: StarCastTheme.emeraldGreen,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 12,
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        const Text('•', style: TextStyle(color: StarCastTheme.textSubtle)),
                                        const SizedBox(width: 8),
                                        Text(
                                          timeago.format(latestArticle.createdAt),
                                          style: const TextStyle(
                                            color: StarCastTheme.textMuted,
                                            fontSize: 12,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      latestArticle.title,
                                      style: const TextStyle(
                                        color: StarCastTheme.textHighContrast,
                                        fontSize: 20,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: -0.3,
                                      ),
                                    ),
                                    if (latestArticle.excerpt != null) ...[
                                      const SizedBox(height: 8),
                                      Text(
                                        latestArticle.excerpt!,
                                        maxLines: 3,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          color: StarCastTheme.textMuted,
                                          fontSize: 13,
                                          height: 1.4,
                                        ),
                                      ),
                                    ],
                                    const SizedBox(height: 16),
                                    Row(
                                      children: const [
                                        Text(
                                          'Read Full Story',
                                          style: TextStyle(
                                            color: StarCastTheme.emeraldGreen,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 13,
                                          ),
                                        ),
                                        SizedBox(width: 4),
                                        Icon(Icons.arrow_forward_rounded, color: StarCastTheme.emeraldGreen, size: 16),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 28),
                    ],

                    // SECONDARY RECENT STORIES LIST
                    if (secondaryArticles.isNotEmpty) ...[
                      const Text(
                        'Recent Editorial Dispatches',
                        style: TextStyle(
                          color: StarCastTheme.textHighContrast,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),

                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: secondaryArticles.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          final article = secondaryArticles[index];
                          return InkWell(
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => ArticleDetailScreen(article: article),
                                ),
                              );
                            },
                            borderRadius: BorderRadius.circular(16),
                            child: Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: StarCastTheme.liftedPanel,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: StarCastTheme.subtleBorder),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  if (article.thumbnailUrl != null) ...[
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(10),
                                      child: SizedBox(
                                        width: 80,
                                        height: 80,
                                        child: CachedNetworkImage(
                                          imageUrl: article.thumbnailUrl!,
                                          fit: BoxFit.cover,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 14),
                                  ],
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          article.authorName,
                                          style: const TextStyle(
                                            color: StarCastTheme.emeraldGreen,
                                            fontWeight: FontWeight.w600,
                                            fontSize: 11,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          article.title,
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(
                                            color: StarCastTheme.textHighContrast,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 14,
                                          ),
                                        ),
                                        const SizedBox(height: 6),
                                        Text(
                                          timeago.format(article.createdAt),
                                          style: const TextStyle(
                                            color: StarCastTheme.textSubtle,
                                            fontSize: 11,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ],
                  ],
                ),
              ),
      ),
    );
  }
}
