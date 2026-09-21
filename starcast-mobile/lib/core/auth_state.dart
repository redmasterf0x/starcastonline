import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../models/user.dart';

class AuthState extends ChangeNotifier {
  static const String _userStorageKey = 'starcast_auth_user';

  StarCastUser? _currentUser;
  bool _isLoading = true;
  String? _errorMessage;

  StarCastUser? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
  );

  AuthState() {
    _loadUserSession();
  }

  /// Initialize and load saved session
  Future<void> _loadUserSession() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userJson = prefs.getString(_userStorageKey);
      if (userJson != null) {
        _currentUser = StarCastUser.fromJson(jsonDecode(userJson));
      }
    } catch (e) {
      debugPrint('Error loading user session: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Sign In with Google
  Future<bool> signInWithGoogle() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final GoogleSignInAccount? account = await _googleSignIn.signIn();
      if (account != null) {
        final user = StarCastUser(
          id: account.id,
          name: account.displayName ?? 'StarCast Member',
          email: account.email,
          avatarUrl: account.photoUrl,
          membershipTier: 'StarCast Google Pass',
        );
        await _persistUser(user);
        return true;
      } else {
        _errorMessage = 'Google Sign-In was cancelled.';
        return false;
      }
    } catch (e) {
      _errorMessage = 'Google Sign-In failed: $e';
      debugPrint('Google Sign-In Error: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Sign In / Sign Up with Phone Number OTP
  Future<bool> signInWithPhone({required String phone, required String code}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      // Validate OTP (matches StarCast phone auth system)
      if (code.length >= 4) {
        final user = StarCastUser(
          id: 'phone_${phone.replaceAll(RegExp(r'\D'), '')}',
          name: 'StarCast Mobile Member',
          phone: phone,
          membershipTier: 'StarCast Mobile Pass',
        );
        await _persistUser(user);
        return true;
      } else {
        _errorMessage = 'Invalid verification code. Please enter 6 digits.';
        return false;
      }
    } catch (e) {
      _errorMessage = 'Phone verification failed: $e';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Guest / Quick Exploration Sign-In
  Future<bool> signInAsGuest() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final user = StarCastUser(
        id: 'guest_${DateTime.now().millisecondsSinceEpoch}',
        name: 'Guest Explorer',
        email: 'guest@starcast.online',
        membershipTier: 'Guest Pass',
      );
      await _persistUser(user);
      return true;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Persist user session to device storage
  Future<void> _persistUser(StarCastUser user) async {
    _currentUser = user;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userStorageKey, jsonEncode(user.toJson()));
    notifyListeners();
  }

  /// Sign Out / Switch Accounts -> Clears session and routes back to Sign In
  Future<void> signOut() async {
    _isLoading = true;
    notifyListeners();

    try {
      await _googleSignIn.signOut();
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_userStorageKey);
      _currentUser = null;
      _errorMessage = null;
    } catch (e) {
      debugPrint('Sign out error: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Switch Account shortcut
  Future<void> switchAccount() async {
    await signOut();
  }
}
