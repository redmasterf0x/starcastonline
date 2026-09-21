import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../core/auth_state.dart';
import 'watch_screen.dart';
import 'articles_screen.dart';
import 'community_screen.dart';
import 'profile_screen.dart';

class MainShell extends StatefulWidget {
  final AuthState authState;

  const MainShell({super.key, required this.authState});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final screens = [
      const WatchScreen(),
      const ArticlesScreen(),
      CommunityScreen(authState: widget.authState),
      ProfileScreen(authState: widget.authState),
    ];

    return Scaffold(
      backgroundColor: StarCastTheme.deepSpace,
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: StarCastTheme.subtleBorder, width: 1)),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          backgroundColor: const Color(0xFA080829),
          selectedItemColor: StarCastTheme.sunsetOrange,
          unselectedItemColor: StarCastTheme.textMuted,
          type: BottomNavigationBarType.fixed,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.tv_rounded),
              activeIcon: Icon(Icons.tv_rounded, color: StarCastTheme.sunsetOrange),
              label: 'Watch',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.article_outlined),
              activeIcon: Icon(Icons.article_rounded, color: StarCastTheme.sunsetOrange),
              label: 'Articles',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.forum_outlined),
              activeIcon: Icon(Icons.forum_rounded, color: StarCastTheme.sunsetOrange),
              label: 'The DECK',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline_rounded),
              activeIcon: Icon(Icons.person_rounded, color: StarCastTheme.sunsetOrange),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}
