import 'package:flutter/material.dart';

class StarCastShow {
  final String id;
  final String title;
  final String genre;
  final String playlistId;
  final Color color;
  final String description;
  final List<ShowEpisode> episodes;

  StarCastShow({
    required this.id,
    required this.title,
    required this.genre,
    required this.playlistId,
    required this.color,
    required this.description,
    this.episodes = const [],
  });

  static List<StarCastShow> get officialShows => [
    StarCastShow(
      id: 'theobservationdeck',
      title: 'The Observation Deck',
      genre: 'Talk Show',
      playlistId: 'PLDbbiC-_h16B7OOQUpj9iotFkJUwILcvp',
      color: const Color(0xFFEA6F2A),
      description: 'StarCast flagship talk show featuring live interviews, cultural commentary, and community leaders.',
    ),
    StarCastShow(
      id: 'hollywood-after-babylon',
      title: 'Hollywood After Babylon',
      genre: 'Documentary',
      playlistId: 'PLDbbiC-_h16AHTgcaaQSbgjBCAFPKBVaB',
      color: const Color(0xFF22B573),
      description: 'Deep dive documentary journalism uncovering forgotten cinema history, media scandals, and lore.',
    ),
    StarCastShow(
      id: 'star-talk',
      title: 'Star Talk',
      genre: 'Interviews',
      playlistId: 'PLDbbiC-_h16DYMdZworSvFVy3iEpjKgXM',
      color: const Color(0xFF20EFE0),
      description: 'One-on-one spotlight conversations with artists, musicians, athletes, and Midwest innovators.',
    ),
    StarCastShow(
      id: 'psyco-g-spot',
      title: 'StarCast Presents: The Psyco G Spot',
      genre: 'Commentary',
      playlistId: 'PLDbbiC-_h16AyfackURSCeNzTZAGB-0Ci',
      color: const Color(0xFFF4A53C),
      description: 'Unfiltered pop culture critique, underground sounds, and spontaneous creative debate.',
    ),
  ];
}

class ShowEpisode {
  final String id;
  final String title;
  final String? description;
  final String thumbnailUrl;
  final String videoUrl;
  final String publishedAt;

  ShowEpisode({
    required this.id,
    required this.title,
    this.description,
    required this.thumbnailUrl,
    required this.videoUrl,
    required this.publishedAt,
  });

  factory ShowEpisode.fromJson(Map<String, dynamic> json) {
    return ShowEpisode(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'StarCast Episode',
      description: json['description']?.toString(),
      thumbnailUrl: json['thumbnail']?.toString() ??
          'https://i.ytimg.com/vi/${json['id']}/hqdefault.jpg',
      videoUrl: json['url']?.toString() ?? 'https://www.youtube.com/watch?v=${json['id']}',
      publishedAt: json['publishedAt']?.toString() ?? 'Recently',
    );
  }
}
