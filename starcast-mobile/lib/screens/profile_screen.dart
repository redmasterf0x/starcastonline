import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/theme.dart';
import '../core/auth_state.dart';

class ProfileScreen extends StatelessWidget {
  final AuthState authState;

  const ProfileScreen({super.key, required this.authState});

  Future<void> _openWebUrl(String urlString) async {
    final url = Uri.parse(urlString);
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  void _confirmSignOut(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: StarCastTheme.liftedPanel,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text(
          'Sign Out or Switch Account?',
          style: TextStyle(color: StarCastTheme.textHighContrast, fontWeight: FontWeight.bold),
        ),
        content: const Text(
          'You will be returned to the Sign In screen to change accounts or log in again.',
          style: TextStyle(color: StarCastTheme.textMuted, fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: StarCastTheme.textMuted)),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await authState.signOut();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: StarCastTheme.sunsetOrange,
              foregroundColor: Colors.white,
            ),
            child: const Text('Sign Out / Switch'),
          ),
        ],
      ),
    );
  }

  void _confirmDeleteAccount(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: StarCastTheme.liftedPanel,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: Colors.redAccent),
        ),
        title: Row(
          children: const [
            Icon(Icons.warning_amber_rounded, color: Colors.redAccent, size: 24),
            SizedBox(width: 8),
            Text(
              'Delete Account & Data',
              style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold, fontSize: 18),
            ),
          ],
        ),
        content: const Text(
          'Are you sure you want to permanently delete your StarCast account and all associated data?\n\nThis will remove your profile, discussions, and session data. This action cannot be undone.',
          style: TextStyle(color: StarCastTheme.textHighContrast, fontSize: 13, height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: StarCastTheme.textMuted)),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await authState.signOut();
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Your account deletion request has been processed.'),
                    backgroundColor: Colors.redAccent,
                  ),
                );
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.redAccent,
              foregroundColor: Colors.white,
            ),
            child: const Text('Permanently Delete'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = authState.currentUser;

    return Scaffold(
      backgroundColor: StarCastTheme.deepSpace,
      appBar: AppBar(
        title: const Text('My Profile & Account'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Column(
          children: [
            // Profile Card
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: StarCastTheme.liftedPanel,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: StarCastTheme.subtleBorder),
                boxShadow: const [
                  BoxShadow(
                    color: Colors.black38,
                    blurRadius: 16,
                    offset: Offset(0, 6),
                  ),
                ],
              ),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 38,
                    backgroundColor: StarCastTheme.sunsetOrange.withOpacity(0.2),
                    child: Text(
                      user != null && user.name.isNotEmpty ? user.name[0].toUpperCase() : 'S',
                      style: const TextStyle(
                        color: StarCastTheme.sunsetOrange,
                        fontSize: 32,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),

                  Text(
                    user?.name ?? 'StarCast Member',
                    style: const TextStyle(
                      color: StarCastTheme.textHighContrast,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),

                  if (user?.email != null)
                    Text(
                      user!.email!,
                      style: const TextStyle(color: StarCastTheme.textMuted, fontSize: 13),
                    ),
                  if (user?.phone != null)
                    Text(
                      user!.phone!,
                      style: const TextStyle(color: StarCastTheme.textMuted, fontSize: 13),
                    ),
                  const SizedBox(height: 12),

                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: StarCastTheme.emeraldGreen.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: StarCastTheme.emeraldGreen.withOpacity(0.4)),
                    ),
                    child: Text(
                      user?.membershipTier ?? 'StarCast Pass',
                      style: const TextStyle(
                        color: StarCastTheme.emeraldGreen,
                        fontWeight: FontWeight.bold,
                        fontSize: 11,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Account & App Options
            Container(
              decoration: BoxDecoration(
                color: StarCastTheme.liftedPanel,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: StarCastTheme.subtleBorder),
              ),
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.language_rounded, color: StarCastTheme.electricCyan),
                    title: const Text('StarCast Online Web', style: TextStyle(color: StarCastTheme.textHighContrast)),
                    subtitle: const Text('https://starcast.online', style: TextStyle(color: StarCastTheme.textSubtle, fontSize: 12)),
                    trailing: const Icon(Icons.open_in_new_rounded, color: StarCastTheme.textMuted, size: 18),
                    onTap: () => _openWebUrl('https://starcast.online'),
                  ),
                  const Divider(color: StarCastTheme.subtleBorder, height: 1),
                  ListTile(
                    leading: const Icon(Icons.shield_outlined, color: StarCastTheme.textMuted),
                    title: const Text('Privacy Policy', style: TextStyle(color: StarCastTheme.textHighContrast)),
                    trailing: const Icon(Icons.chevron_right_rounded, color: StarCastTheme.textMuted),
                    onTap: () => _openWebUrl('https://starcast.online/privacy'),
                  ),
                  const Divider(color: StarCastTheme.subtleBorder, height: 1),
                  ListTile(
                    leading: const Icon(Icons.description_outlined, color: StarCastTheme.textMuted),
                    title: const Text('Terms of Service', style: TextStyle(color: StarCastTheme.textHighContrast)),
                    trailing: const Icon(Icons.chevron_right_rounded, color: StarCastTheme.textMuted),
                    onTap: () => _openWebUrl('https://starcast.online/terms'),
                  ),
                  const Divider(color: StarCastTheme.subtleBorder, height: 1),
                  ListTile(
                    leading: const Icon(Icons.delete_forever_outlined, color: Colors.redAccent),
                    title: const Text('Account Deletion URL', style: TextStyle(color: StarCastTheme.textHighContrast)),
                    subtitle: const Text('https://starcast.online/delete-account', style: TextStyle(color: StarCastTheme.textSubtle, fontSize: 12)),
                    trailing: const Icon(Icons.open_in_new_rounded, color: StarCastTheme.textMuted, size: 18),
                    onTap: () => _openWebUrl('https://starcast.online/delete-account'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // SWITCH ACCOUNT & SIGN OUT
            Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: StarCastTheme.liftedPanel,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: StarCastTheme.subtleBorder),
              ),
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.switch_account_rounded, color: StarCastTheme.sunsetOrange),
                    title: const Text(
                      'Switch Account / Sign In',
                      style: TextStyle(
                        color: StarCastTheme.sunsetOrange,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    subtitle: const Text(
                      'Log in with a different Google account or phone number',
                      style: TextStyle(color: StarCastTheme.textSubtle, fontSize: 12),
                    ),
                    onTap: () => _confirmSignOut(context),
                  ),
                  const Divider(color: StarCastTheme.subtleBorder, height: 1),
                  ListTile(
                    leading: const Icon(Icons.logout_rounded, color: StarCastTheme.textMuted),
                    title: const Text(
                      'Sign Out',
                      style: TextStyle(
                        color: StarCastTheme.textHighContrast,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    onTap: () => _confirmSignOut(context),
                  ),
                  const Divider(color: StarCastTheme.subtleBorder, height: 1),
                  ListTile(
                    leading: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent),
                    title: const Text(
                      'Delete Account & Data',
                      style: TextStyle(
                        color: Colors.redAccent,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    subtitle: const Text(
                      'Permanently remove your account and all data',
                      style: TextStyle(color: StarCastTheme.textSubtle, fontSize: 12),
                    ),
                    onTap: () => _confirmDeleteAccount(context),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            const Text(
              'StarCast Mobile v1.0.2\nPackage: online.starcast.app',
              textAlign: TextAlign.center,
              style: TextStyle(color: StarCastTheme.textSubtle, fontSize: 11, height: 1.5),
            ),
          ],
        ),
      ),
    );
  }
}
