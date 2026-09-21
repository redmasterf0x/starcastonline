import 'package:flutter/material.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../core/theme.dart';
import '../core/api_service.dart';
import '../core/auth_state.dart';
import '../models/community_post.dart';

class CommunityScreen extends StatefulWidget {
  final AuthState authState;

  const CommunityScreen({super.key, required this.authState});

  @override
  State<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends State<CommunityScreen> {
  List<CommunityPost> _posts = [];
  bool _isLoading = true;
  String _selectedCategory = 'All';

  final List<String> _categories = ['All', 'The DECK', 'Discussion', 'Shows', 'Music'];

  @override
  void initState() {
    super.initState();
    _loadPosts();
  }

  Future<void> _loadPosts() async {
    setState(() => _isLoading = true);
    final posts = await StarCastApiService.fetchCommunityPosts();
    if (mounted) {
      setState(() {
        _posts = posts;
        _isLoading = false;
      });
    }
  }

  List<CommunityPost> get _filteredPosts {
    if (_selectedCategory == 'All') return _posts;
    return _posts.where((p) => p.category.toLowerCase() == _selectedCategory.toLowerCase()).toList();
  }

  void _showNewPostModal() {
    final titleController = TextEditingController();
    final contentController = TextEditingController();
    String category = 'The DECK';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: StarCastTheme.liftedPanel,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 24,
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Start a Discussion',
                        style: TextStyle(
                          color: StarCastTheme.textHighContrast,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: StarCastTheme.textMuted),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  TextField(
                    controller: titleController,
                    style: const TextStyle(color: StarCastTheme.textHighContrast),
                    decoration: const InputDecoration(
                      hintText: 'Discussion Topic / Headline',
                    ),
                  ),
                  const SizedBox(height: 12),

                  TextField(
                    controller: contentController,
                    maxLines: 4,
                    style: const TextStyle(color: StarCastTheme.textHighContrast),
                    decoration: const InputDecoration(
                      hintText: 'What is on your mind? Share thoughts with the StarCast community...',
                    ),
                  ),
                  const SizedBox(height: 20),

                  ElevatedButton(
                    onPressed: () async {
                      final title = titleController.text.trim();
                      final content = contentController.text.trim();
                      if (content.isNotEmpty) {
                        Navigator.pop(context);
                        final author = widget.authState.currentUser?.name ?? 'Community Member';
                        await StarCastApiService.createCommunityPost(
                          title: title.isEmpty ? content.substring(0, 40) : title,
                          content: content,
                          category: category,
                          authorName: author,
                        );
                        _loadPosts();
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: StarCastTheme.amberGold,
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: const Text('Post to The DECK', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filteredPosts;

    return Scaffold(
      backgroundColor: StarCastTheme.deepSpace,
      appBar: AppBar(
        title: Row(
          children: const [
            Icon(Icons.forum_rounded, color: StarCastTheme.amberGold, size: 22),
            SizedBox(width: 8),
            Text('The DECK Community'),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showNewPostModal,
        backgroundColor: StarCastTheme.amberGold,
        foregroundColor: Colors.black,
        icon: const Icon(Icons.add_comment_rounded),
        label: const Text('New Post', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: RefreshIndicator(
        onRefresh: _loadPosts,
        color: StarCastTheme.amberGold,
        backgroundColor: StarCastTheme.liftedPanel,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: StarCastTheme.amberGold))
            : SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Category Chips
                    SizedBox(
                      height: 38,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: _categories.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 8),
                        itemBuilder: (context, index) {
                          final cat = _categories[index];
                          final isSelected = cat == _selectedCategory;
                          return ChoiceChip(
                            label: Text(cat),
                            selected: isSelected,
                            onSelected: (_) => setState(() => _selectedCategory = cat),
                            selectedColor: StarCastTheme.amberGold.withOpacity(0.2),
                            backgroundColor: StarCastTheme.liftedPanel,
                            side: BorderSide(
                              color: isSelected ? StarCastTheme.amberGold : StarCastTheme.subtleBorder,
                            ),
                            labelStyle: TextStyle(
                              color: isSelected ? StarCastTheme.amberGold : StarCastTheme.textMuted,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                              fontSize: 12,
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Post Cards
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: filtered.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        final post = filtered[index];
                        return Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: StarCastTheme.liftedPanel,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: StarCastTheme.subtleBorder),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  CircleAvatar(
                                    radius: 14,
                                    backgroundColor: StarCastTheme.amberGold.withOpacity(0.2),
                                    child: Text(
                                      post.authorName.isNotEmpty ? post.authorName[0] : 'U',
                                      style: const TextStyle(
                                        color: StarCastTheme.amberGold,
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Text(
                                    post.authorName,
                                    style: const TextStyle(
                                      color: StarCastTheme.textHighContrast,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  const Text('•', style: TextStyle(color: StarCastTheme.textSubtle)),
                                  const SizedBox(width: 8),
                                  Text(
                                    timeago.format(post.createdAt),
                                    style: const TextStyle(color: StarCastTheme.textSubtle, fontSize: 11),
                                  ),
                                  const Spacer(),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: StarCastTheme.baseNavy,
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(color: StarCastTheme.subtleBorder),
                                    ),
                                    child: Text(
                                      post.category.toUpperCase(),
                                      style: const TextStyle(
                                        color: StarCastTheme.amberGold,
                                        fontSize: 9,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),

                              if (post.title.isNotEmpty && post.title != post.content) ...[
                                Text(
                                  post.title,
                                  style: const TextStyle(
                                    color: StarCastTheme.textHighContrast,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 15,
                                  ),
                                ),
                                const SizedBox(height: 6),
                              ],

                              Text(
                                post.content,
                                style: const TextStyle(
                                  color: Color(0xFFCBD0F2),
                                  fontSize: 13,
                                  height: 1.4,
                                ),
                              ),
                              const SizedBox(height: 14),

                              Row(
                                children: [
                                  Icon(Icons.mode_comment_outlined, size: 16, color: StarCastTheme.textMuted),
                                  const SizedBox(width: 6),
                                  Text(
                                    '${post.repliesCount} replies',
                                    style: const TextStyle(color: StarCastTheme.textMuted, fontSize: 12),
                                  ),
                                  const SizedBox(width: 20),
                                  Icon(Icons.favorite_border_rounded, size: 16, color: StarCastTheme.textMuted),
                                  const SizedBox(width: 6),
                                  Text(
                                    '${post.likesCount}',
                                    style: const TextStyle(color: StarCastTheme.textMuted, fontSize: 12),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 60),
                  ],
                ),
              ),
      ),
    );
  }
}
