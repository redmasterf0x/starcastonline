import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../core/theme.dart';
import '../models/article.dart';

class ArticleDetailScreen extends StatelessWidget {
  final Article article;

  const ArticleDetailScreen({super.key, required this.article});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: StarCastTheme.deepSpace,
      appBar: AppBar(
        title: const Text('StarCast Article'),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_rounded, color: StarCastTheme.textHighContrast),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Sharing: https://starcast.online/articles/${article.slug}'),
                  backgroundColor: StarCastTheme.liftedPanel,
                ),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Tags
            if (article.tags.isNotEmpty) ...[
              Wrap(
                spacing: 8,
                runSpacing: 6,
                children: article.tags.map((tag) {
                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: StarCastTheme.emeraldGreen.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: StarCastTheme.emeraldGreen.withOpacity(0.4)),
                    ),
                    child: Text(
                      tag.toUpperCase(),
                      style: const TextStyle(
                        color: StarCastTheme.emeraldGreen,
                        fontWeight: FontWeight.bold,
                        fontSize: 10,
                        letterSpacing: 0.5,
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 12),
            ],

            // Headline
            Text(
              article.title,
              style: const TextStyle(
                color: StarCastTheme.textHighContrast,
                fontSize: 26,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.5,
                height: 1.25,
              ),
            ),
            const SizedBox(height: 12),

            // Subtitle
            if (article.subtitle != null) ...[
              Text(
                article.subtitle!,
                style: const TextStyle(
                  color: StarCastTheme.amberGold,
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Author & Date Meta Row
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: StarCastTheme.liftedPanel,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: StarCastTheme.subtleBorder),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    backgroundColor: StarCastTheme.emeraldGreen.withOpacity(0.2),
                    radius: 18,
                    child: Text(
                      article.authorName.isNotEmpty ? article.authorName[0] : 'S',
                      style: const TextStyle(color: StarCastTheme.emeraldGreen, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        article.authorName,
                        style: const TextStyle(
                          color: StarCastTheme.textHighContrast,
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                      Text(
                        timeago.format(article.createdAt),
                        style: const TextStyle(color: StarCastTheme.textSubtle, fontSize: 11),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Cover Image
            if (article.thumbnailUrl != null) ...[
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: AspectRatio(
                  aspectRatio: 16 / 9,
                  child: CachedNetworkImage(
                    imageUrl: article.thumbnailUrl!,
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              const SizedBox(height: 24),
            ],

            // Article Content Body
            Text(
              article.content ?? article.excerpt ?? 'No content available.',
              style: const TextStyle(
                color: Color(0xFFDBE0FB),
                fontSize: 16,
                height: 1.7,
                letterSpacing: 0.2,
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}
