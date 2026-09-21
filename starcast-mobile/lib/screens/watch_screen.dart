import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/theme.dart';
import '../models/show.dart';

class WatchScreen extends StatefulWidget {
  const WatchScreen({super.key});

  @override
  State<WatchScreen> createState() => _WatchScreenState();
}

class _WatchScreenState extends State<WatchScreen> {
  final List<StarCastShow> _shows = StarCastShow.officialShows;
  int _selectedShowIndex = 0;

  Future<void> _openPlaylist(String playlistId) async {
    final url = Uri.parse('https://www.youtube.com/playlist?list=$playlistId');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _openChannel() async {
    final url = Uri.parse('https://www.youtube.com/channel/UCZ3dy9aqC46t33dzbBSmNjw');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final activeShow = _shows[_selectedShowIndex];

    return Scaffold(
      backgroundColor: StarCastTheme.deepSpace,
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: StarCastTheme.sunsetOrange,
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Text(
                'LIVE',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                  fontSize: 10,
                  letterSpacing: 1,
                ),
              ),
            ),
            const SizedBox(width: 8),
            const Text('Watch Broadcasts'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.ondemand_video_rounded, color: StarCastTheme.sunsetOrange),
            tooltip: 'StarCast YouTube Channel',
            onPressed: _openChannel,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Eyebrow
            const Text(
              'ORIGINAL BROADCASTS',
              style: TextStyle(
                color: StarCastTheme.electricCyan,
                fontSize: 11,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.5,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'StarCast Shows & Series',
              style: TextStyle(
                color: StarCastTheme.textHighContrast,
                fontSize: 24,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 16),

            // Horizontal Show Selector Chips
            SizedBox(
              height: 42,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _shows.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  final show = _shows[index];
                  final isSelected = index == _selectedShowIndex;
                  return ChoiceChip(
                    label: Text(show.title),
                    selected: isSelected,
                    onSelected: (_) => setState(() => _selectedShowIndex = index),
                    selectedColor: show.color.withOpacity(0.25),
                    backgroundColor: StarCastTheme.liftedPanel,
                    side: BorderSide(
                      color: isSelected ? show.color : StarCastTheme.subtleBorder,
                      width: isSelected ? 1.5 : 1,
                    ),
                    labelStyle: TextStyle(
                      color: isSelected ? show.color : StarCastTheme.textMuted,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                      fontSize: 12,
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 20),

            // Active Show Spotlight Card
            Container(
              decoration: BoxDecoration(
                color: StarCastTheme.liftedPanel,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: activeShow.color.withOpacity(0.6)),
                boxShadow: [
                  BoxShadow(
                    color: activeShow.color.withOpacity(0.12),
                    blurRadius: 24,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Video Banner / Poster preview
                  Stack(
                    children: [
                      ClipRRect(
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(19)),
                        child: AspectRatio(
                          aspectRatio: 16 / 9,
                          child: Container(
                            color: StarCastTheme.baseNavy,
                            child: Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: activeShow.color.withOpacity(0.2),
                                      border: Border.all(color: activeShow.color, width: 2),
                                    ),
                                    child: Icon(
                                      Icons.play_arrow_rounded,
                                      color: activeShow.color,
                                      size: 40,
                                    ),
                                  ),
                                  const SizedBox(height: 10),
                                  Text(
                                    activeShow.title,
                                    style: const TextStyle(
                                      color: StarCastTheme.textHighContrast,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                      Positioned(
                        top: 12,
                        left: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: activeShow.color,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            activeShow.genre.toUpperCase(),
                            style: const TextStyle(
                              color: Colors.black,
                              fontWeight: FontWeight.w900,
                              fontSize: 10,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),

                  // Show Details
                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          activeShow.title,
                          style: TextStyle(
                            color: StarCastTheme.textHighContrast,
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          activeShow.description,
                          style: const TextStyle(
                            color: StarCastTheme.textMuted,
                            fontSize: 14,
                            height: 1.4,
                          ),
                        ),
                        const SizedBox(height: 20),

                        // Action Buttons
                        Row(
                          children: [
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: () => _openPlaylist(activeShow.playlistId),
                                icon: const Icon(Icons.play_circle_fill_rounded, size: 20),
                                label: const Text('Watch Full Series'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: activeShow.color,
                                  foregroundColor: Colors.black,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),

            // All Shows Grid
            const Text(
              'All StarCast Broadcasts',
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
              itemCount: _shows.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final s = _shows[index];
                return InkWell(
                  onTap: () => setState(() => _selectedShowIndex = index),
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: StarCastTheme.liftedPanel,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: StarCastTheme.subtleBorder),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: s.color.withOpacity(0.15),
                            border: Border.all(color: s.color.withOpacity(0.4)),
                          ),
                          child: Icon(Icons.tv_rounded, color: s.color, size: 24),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                s.title,
                                style: const TextStyle(
                                  color: StarCastTheme.textHighContrast,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                s.genre,
                                style: TextStyle(color: s.color, fontSize: 12, fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                        ),
                        const Icon(Icons.chevron_right_rounded, color: StarCastTheme.textMuted),
                      ],
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
