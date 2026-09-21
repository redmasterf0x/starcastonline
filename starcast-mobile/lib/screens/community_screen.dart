import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
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
  static const String _blockedUsersKey = 'starcast_blocked_users';
  static const String _hiddenPostsKey = 'starcast_hidden_posts';

  List<CommunityPost> _posts = [];
  Set<String> _blockedUsers = {};
  Set<String> _hiddenPosts = {};
  bool _isLoading = true;
  String _selectedCategory = 'All';

  final List<String> _categories = ['All', 'The DECK', 'Discussion', 'Shows', 'Music'];

  @override
  void initState() {
    super.initState();
    _loadSafetyAndPosts();
  }

  Future<void> _loadSafetyAndPosts() async {
    final prefs = await SharedPreferences.getInstance();
    final blockedList = prefs.getStringList(_blockedUsersKey) ?? [];
    final hiddenList = prefs.getStringList(_hiddenPostsKey) ?? [];

    setState(() {
      _blockedUsers = blockedList.toSet();
      _hiddenPosts = hiddenList.toSet();
    });

    await _loadPosts();
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
    return _posts.where((p) {
      if (_hiddenPosts.contains(p.id)) return false;
      if (_blockedUsers.contains(p.authorName.toLowerCase())) return false;
      if (_selectedCategory == 'All') return true;
      return p.category.toLowerCase() == _selectedCategory.toLowerCase();
    }).toList();
  }

  Future<void> _blockUser(String authorName) async {
    final prefs = await SharedPreferences.getInstance();
    _blockedUsers.add(authorName.toLowerCase());
    await prefs.setStringList(_blockedUsersKey, _blockedUsers.toList());
    setState(() {});

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Blocked $authorName. You will no longer see their posts.'),
          backgroundColor: StarCastTheme.baseNavy,
          action: SnackBarAction(
            label: 'Undo',
            textColor: StarCastTheme.amberGold,
            onPressed: () async {
              _blockedUsers.remove(authorName.toLowerCase());
              await prefs.setStringList(_blockedUsersKey, _blockedUsers.toList());
              setState(() {});
            },
          ),
        ),
      );
    }
  }

  Future<void> _hidePost(String postId) async {
    final prefs = await SharedPreferences.getInstance();
    _hiddenPosts.add(postId);
    await prefs.setStringList(_hiddenPostsKey, _hiddenPosts.toList());
    setState(() {});

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Post hidden from your feed.'),
          backgroundColor: StarCastTheme.baseNavy,
        ),
      );
    }
  }

  void _showReportDialog(CommunityPost post) {
    String selectedReason = 'Inappropriate content';
    final reasons = [
      'Inappropriate content or language',
      'Harassment or hate speech',
      'Spam or advertising',
      'Misleading or false information',
      'Copyright or intellectual property',
    ];

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: StarCastTheme.liftedPanel,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: const BorderSide(color: StarCastTheme.subtleBorder),
              ),
              title: Row(
                children: const [
                  Icon(Icons.flag_rounded, color: StarCastTheme.sunsetOrange, size: 24),
                  SizedBox(width: 8),
                  Text(
                    'Report Content',
                    style: TextStyle(color: StarCastTheme.textHighContrast, fontSize: 18),
                  ),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Help us keep StarCast safe. Why are you reporting "${post.title.isNotEmpty ? post.title : 'this post'}"?',
                    style: const TextStyle(color: StarCastTheme.textMuted, fontSize: 13),
                  ),
                  const SizedBox(height: 16),
                  ...reasons.map((r) => RadioListTile<String>(
                        dense: true,
                        activeColor: StarCastTheme.sunsetOrange,
                        title: Text(
                          r,
                          style: const TextStyle(color: StarCastTheme.textHighContrast, fontSize: 13),
                        ),
                        value: r,
                        groupValue: selectedReason,
                        onChanged: (val) {
                          if (val != null) {
                            setDialogState(() => selectedReason = val);
                          }
                        },
                      )),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancel', style: TextStyle(color: StarCastTheme.textMuted)),
                ),
                ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    _hidePost(post.id);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: const Text('Report submitted. Our moderation team will review this within 24 hours.'),
                        backgroundColor: StarCastTheme.emeraldGreen,
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: StarCastTheme.sunsetOrange,
                  ),
                  child: const Text('Submit Report'),
                ),
              ],
            );
          },
        );
      },
    );
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
                          title: title.isEmpty ? (content.length > 40 ? content.substring(0, 40) : content) : title,
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

                    if (filtered.isEmpty)
                      Center(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 48),
                          child: Column(
                            children: const [
                              Icon(Icons.chat_bubble_outline_rounded, size: 48, color: StarCastTheme.textMuted),
                              SizedBox(height: 12),
                              Text(
                                'No discussions in this category yet.',
                                style: TextStyle(color: StarCastTheme.textMuted, fontSize: 14),
                              ),
                            ],
                          ),
                        ),
                      )
                    else
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
                                    const SizedBox(width: 4),

                                    // 3-Dots UGC Menu (Block / Report / Hide)
                                    PopupMenuButton<String>(
                                      icon: const Icon(Icons.more_vert, size: 18, color: StarCastTheme.textMuted),
                                      color: StarCastTheme.liftedPanel,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12),
                                        side: const BorderSide(color: StarCastTheme.subtleBorder),
                                      ),
                                      onSelected: (action) {
                                        if (action == 'report') {
                                          _showReportDialog(post);
                                        } else if (action == 'block') {
                                          _blockUser(post.authorName);
                                        } else if (action == 'hide') {
                                          _hidePost(post.id);
                                        }
                                      },
                                      itemBuilder: (context) => [
                                        PopupMenuItem(
                                          value: 'report',
                                          child: Row(
                                            children: const [
                                              Icon(Icons.flag_outlined, size: 18, color: StarCastTheme.sunsetOrange),
                                              SizedBox(width: 10),
                                              Text('Report Post', style: TextStyle(color: StarCastTheme.textHighContrast, fontSize: 13)),
                                            ],
                                          ),
                                        ),
                                        PopupMenuItem(
                                          value: 'block',
                                          child: Row(
                                            children: [
                                              const Icon(Icons.block, size: 18, color: Colors.redAccent),
                                              const SizedBox(width: 10),
                                              Text('Block ${post.authorName}', style: const TextStyle(color: StarCastTheme.textHighContrast, fontSize: 13)),
                                            ],
                                          ),
                                        ),
                                        PopupMenuItem(
                                          value: 'hide',
                                          child: Row(
                                            children: const [
                                              Icon(Icons.visibility_off_outlined, size: 18, color: StarCastTheme.textMuted),
                                              SizedBox(width: 10),
                                              Text('Hide Post', style: TextStyle(color: StarCastTheme.textMuted, fontSize: 13)),
                                            ],
                                          ),
                                        ),
                                      ],
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
