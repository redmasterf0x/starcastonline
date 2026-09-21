import 'package:flutter/material.dart';
import 'core/theme.dart';
import 'core/auth_state.dart';
import 'screens/auth_screen.dart';
import 'screens/main_shell.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const StarCastApp());
}

class StarCastApp extends StatefulWidget {
  const StarCastApp({super.key});

  @override
  State<StarCastApp> createState() => _StarCastAppState();
}

class _StarCastAppState extends State<StarCastApp> {
  final AuthState _authState = AuthState();

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'StarCast',
      debugShowCheckedModeBanner: false,
      theme: StarCastTheme.darkTheme,
      home: ListenableBuilder(
        listenable: _authState,
        builder: (context, _) {
          // 1. Loading Session state
          if (_authState.isLoading) {
            return const Scaffold(
              backgroundColor: StarCastTheme.deepSpace,
              body: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.radar_rounded, color: StarCastTheme.sunsetOrange, size: 54),
                    SizedBox(height: 16),
                    CircularProgressIndicator(color: StarCastTheme.sunsetOrange),
                  ],
                ),
              ),
            );
          }

          // 2. First-Time / Not Signed In -> Gate with Sign In or Sign Up
          if (!_authState.isAuthenticated) {
            return AuthScreen(authState: _authState);
          }

          // 3. Authenticated -> Main Shell (Watch, Articles, Community, Profile)
          return MainShell(authState: _authState);
        },
      ),
    );
  }
}
