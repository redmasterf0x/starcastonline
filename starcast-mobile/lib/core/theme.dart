import 'package:flutter/material.dart';

/// StarCast 2026 Dark Cosmic Color Palette and Styling Tokens
class StarCastTheme {
  // Deep Cosmic Backgrounds
  static const Color deepSpace = Color(0xFF05051F); // Main canvas
  static const Color baseNavy = Color(0xFF05052D);  // Card backing
  static const Color liftedPanel = Color(0xFF0C0C3F); // Elevated containers
  static const Color subtleBorder = Color(0xFF20205A); // Borders & dividers

  // Accent Colors
  static const Color sunsetOrange = Color(0xFFEA6F2A); // Primary CTA / Brand
  static const Color rustHover = Color(0xFFBC3F00);
  static const Color electricCyan = Color(0xFF20EFE0); // Live broadcast / DJ accent
  static const Color emeraldGreen = Color(0xFF22B573); // Confirmed / verified
  static const Color amberGold = Color(0xFFFFD166);    // Top story / highlights

  // Text Colors
  static const Color textHighContrast = Color(0xFFF5F7FF);
  static const Color textMuted = Color(0xFF9A9FC4);
  static const Color textSubtle = Color(0xFF6B729C);

  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: deepSpace,
      primaryColor: sunsetOrange,
      colorScheme: const ColorScheme.dark(
        primary: sunsetOrange,
        secondary: electricCyan,
        surface: liftedPanel,
        background: deepSpace,
        onPrimary: Colors.white,
        onSecondary: Colors.black,
        onSurface: textHighContrast,
        onBackground: textHighContrast,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: deepSpace,
        elevation: 0,
        centerTitle: false,
        scrolledUnderElevation: 0,
        titleTextStyle: TextStyle(
          color: textHighContrast,
          fontSize: 20,
          fontWeight: FontWeight.bold,
          letterSpacing: -0.5,
        ),
        iconTheme: IconThemeData(color: textHighContrast),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Color(0xFA080829),
        selectedItemColor: sunsetOrange,
        unselectedItemColor: textMuted,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
        selectedLabelStyle: TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
        unselectedLabelStyle: TextStyle(fontWeight: FontWeight.w500, fontSize: 11),
      ),
      cardTheme: const CardThemeData(
        color: liftedPanel,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(16)),
          side: BorderSide(color: subtleBorder, width: 1),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: sunsetOrange,
          foregroundColor: Colors.white,
          elevation: 4,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: textHighContrast,
          side: const BorderSide(color: subtleBorder),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: baseNavy,
        hintStyle: const TextStyle(color: textSubtle, fontSize: 14),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: subtleBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: subtleBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: sunsetOrange, width: 1.5),
        ),
      ),
    );
  }
}
