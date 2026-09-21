import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../core/auth_state.dart';

class AuthScreen extends StatefulWidget {
  final AuthState authState;

  const AuthScreen({super.key, required this.authState});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _otpController = TextEditingController();

  bool _isPhoneMode = false;
  bool _otpSent = false;
  bool _isSubmitting = false;
  String? _localError;

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _handleGoogleSignIn() async {
    setState(() {
      _isSubmitting = true;
      _localError = null;
    });

    final success = await widget.authState.signInWithGoogle();
    if (!success && mounted) {
      setState(() {
        _isSubmitting = false;
        _localError = widget.authState.errorMessage ?? 'Google Sign-In failed.';
      });
    }
  }

  Future<void> _handleSendOtp() async {
    final phone = _phoneController.text.trim();
    if (phone.isEmpty || phone.length < 10) {
      setState(() {
        _localError = 'Please enter a valid 10-digit phone number.';
      });
      return;
    }

    setState(() {
      _isSubmitting = true;
      _localError = null;
    });

    // Simulate OTP dispatch
    await Future.delayed(const Duration(milliseconds: 600));
    if (mounted) {
      setState(() {
        _isSubmitting = false;
        _otpSent = true;
      });
    }
  }

  Future<void> _handleVerifyOtp() async {
    final phone = _phoneController.text.trim();
    final code = _otpController.text.trim();

    if (code.isEmpty || code.length < 4) {
      setState(() {
        _localError = 'Please enter the verification code.';
      });
      return;
    }

    setState(() {
      _isSubmitting = true;
      _localError = null;
    });

    final success = await widget.authState.signInWithPhone(phone: phone, code: code);
    if (!success && mounted) {
      setState(() {
        _isSubmitting = false;
        _localError = widget.authState.errorMessage ?? 'Invalid verification code.';
      });
    }
  }

  Future<void> _handleGuestSignIn() async {
    setState(() {
      _isSubmitting = true;
      _localError = null;
    });
    await widget.authState.signInAsGuest();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: StarCastTheme.deepSpace,
      body: Stack(
        children: [
          // Background Cosmic Glows
          Positioned(
            top: -100,
            right: -100,
            child: Container(
              width: 350,
              height: 350,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    StarCastTheme.sunsetOrange.withOpacity(0.2),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            bottom: -100,
            left: -100,
            child: Container(
              width: 350,
              height: 350,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    StarCastTheme.electricCyan.withOpacity(0.15),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Brand Logo & Icon Header
                    Center(
                      child: Container(
                        width: 84,
                        height: 84,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: StarCastTheme.baseNavy,
                          border: Border.all(color: StarCastTheme.sunsetOrange, width: 2),
                          boxShadow: [
                            BoxShadow(
                              color: StarCastTheme.sunsetOrange.withOpacity(0.3),
                              blurRadius: 24,
                              spreadRadius: 2,
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.radar_rounded,
                          color: StarCastTheme.sunsetOrange,
                          size: 44,
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Titles
                    const Text(
                      'STARCAST',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: StarCastTheme.textHighContrast,
                        fontSize: 32,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 2,
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'BROADCASTING & TALENT NETWORK',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: StarCastTheme.amberGold,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.5,
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Auth Container Card
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: StarCastTheme.liftedPanel,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: StarCastTheme.subtleBorder),
                        boxShadow: const [
                          BoxShadow(
                            color: Colors.black45,
                            blurRadius: 20,
                            offset: Offset(0, 8),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(
                            _isPhoneMode
                                ? (_otpSent ? 'Enter SMS Code' : 'Sign In with Phone')
                                : 'Sign In or Sign Up',
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: StarCastTheme.textHighContrast,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            _isPhoneMode
                                ? (_otpSent
                                    ? 'Enter the 6-digit code sent to ${_phoneController.text}'
                                    : 'Receive a secure verification code via SMS')
                                : 'Access Watch, Articles, and The DECK community',
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: StarCastTheme.textMuted,
                              fontSize: 13,
                            ),
                          ),
                          const SizedBox(height: 24),

                          // Error Banner if present
                          if (_localError != null) ...[
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                              decoration: BoxDecoration(
                                color: Colors.red.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: Colors.red.withOpacity(0.4)),
                              ),
                              child: Text(
                                _localError!,
                                style: const TextStyle(color: Colors.redAccent, fontSize: 13),
                                textAlign: TextAlign.center,
                              ),
                            ),
                            const SizedBox(height: 16),
                          ],

                          if (!_isPhoneMode) ...[
                            // 1. Google Sign-In Primary Button
                            ElevatedButton(
                              onPressed: _isSubmitting ? null : _handleGoogleSignIn,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: StarCastTheme.sunsetOrange,
                                padding: const EdgeInsets.symmetric(vertical: 15),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              child: _isSubmitting
                                  ? const SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                    )
                                  : Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: const [
                                        Icon(Icons.g_mobiledata_rounded, size: 28),
                                        SizedBox(width: 8),
                                        Text(
                                          'Continue with Google',
                                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                                        ),
                                      ],
                                    ),
                            ),
                            const SizedBox(height: 14),

                            // 2. Phone Number Mode Toggle Button
                            OutlinedButton(
                              onPressed: _isSubmitting ? null : () => setState(() => _isPhoneMode = true),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 15),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: const [
                                  Icon(Icons.phone_android_rounded, size: 20, color: StarCastTheme.electricCyan),
                                  SizedBox(width: 10),
                                  Text(
                                    'Continue with Phone Number',
                                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                                  ),
                                ],
                              ),
                            ),
                          ] else ...[
                            // Phone Number Input Flow
                            if (!_otpSent) ...[
                              TextField(
                                controller: _phoneController,
                                keyboardType: TextInputType.phone,
                                style: const TextStyle(color: StarCastTheme.textHighContrast),
                                decoration: const InputDecoration(
                                  hintText: '(555) 000-0000',
                                  prefixIcon: Icon(Icons.phone, color: StarCastTheme.textMuted),
                                ),
                              ),
                              const SizedBox(height: 16),
                              ElevatedButton(
                                onPressed: _isSubmitting ? null : _handleSendOtp,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: StarCastTheme.sunsetOrange,
                                  padding: const EdgeInsets.symmetric(vertical: 15),
                                ),
                                child: _isSubmitting
                                    ? const SizedBox(
                                        height: 20,
                                        width: 20,
                                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                      )
                                    : const Text('Send Verification Code'),
                              ),
                            ] else ...[
                              TextField(
                                controller: _otpController,
                                keyboardType: TextInputType.number,
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  color: StarCastTheme.textHighContrast,
                                  fontSize: 22,
                                  letterSpacing: 8,
                                  fontWeight: FontWeight.bold,
                                ),
                                decoration: const InputDecoration(
                                  hintText: '••••••',
                                ),
                              ),
                              const SizedBox(height: 16),
                              ElevatedButton(
                                onPressed: _isSubmitting ? null : _handleVerifyOtp,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: StarCastTheme.emeraldGreen,
                                  padding: const EdgeInsets.symmetric(vertical: 15),
                                ),
                                child: _isSubmitting
                                    ? const SizedBox(
                                        height: 20,
                                        width: 20,
                                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                      )
                                    : const Text('Confirm & Sign In'),
                              ),
                            ],
                            const SizedBox(height: 12),
                            TextButton(
                              onPressed: () {
                                setState(() {
                                  _isPhoneMode = false;
                                  _otpSent = false;
                                  _localError = null;
                                });
                              },
                              child: const Text(
                                '← Back to all options',
                                style: TextStyle(color: StarCastTheme.textMuted, fontSize: 13),
                              ),
                            ),
                          ],

                          const SizedBox(height: 16),
                          const Divider(color: StarCastTheme.subtleBorder),
                          const SizedBox(height: 12),

                          // 3. Guest Exploration Option
                          TextButton(
                            onPressed: _isSubmitting ? null : _handleGuestSignIn,
                            child: const Text(
                              'Explore as Guest',
                              style: TextStyle(
                                color: StarCastTheme.electricCyan,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),
                    const Text(
                      'By continuing, you agree to the StarCast Terms of Service and Privacy Policy.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: StarCastTheme.textSubtle, fontSize: 11),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
