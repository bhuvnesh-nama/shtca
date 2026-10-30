import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class DemoSimulatorSheet extends StatefulWidget {
  final VoidCallback onActionCompleted;

  const DemoSimulatorSheet({super.key, required this.onActionCompleted});

  @override
  State<DemoSimulatorSheet> createState() => _DemoSimulatorSheetState();
}

class _DemoSimulatorSheetState extends State<DemoSimulatorSheet> {
  String? _runningAction;

  Future<void> _runSimulation(String scenario, String label) async {
    setState(() => _runningAction = scenario);
    try {
      final msg = await ApiService.simulateScenario(scenario);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('$label: $msg'),
          backgroundColor: Colors.indigo,
        ),
      );
      widget.onActionCompleted();
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Simulation failed: $e')),
      );
    } finally {
      if (mounted) setState(() => _runningAction = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(Icons.science_outlined, color: Colors.indigo, size: 22),
              SizedBox(width: 8),
              Text(
                'Demo Simulation Lab',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textDark,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          const Text(
            '1-click triggers to demonstrate auto-clustering, upvote threshold verification, and RWA resolution.',
            style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
          ),
          const SizedBox(height: 16),

          // Scenario 1: Duplicate Auto-Cluster
          _buildActionCard(
            icon: Icons.layers_rounded,
            color: AppTheme.primaryBlue,
            title: 'Simulate Duplicate Report (Auto-Cluster)',
            desc: 'Submits a report within 50m of an existing issue from Flat C-302 to show duplicate clustering.',
            scenario: 'duplicate_cluster',
            label: 'Auto-Cluster',
          ),
          const SizedBox(height: 10),

          // Scenario 2: Community Upvote Surge
          _buildActionCard(
            icon: Icons.thumb_up_alt_rounded,
            color: Colors.blue,
            title: 'Simulate Upvote Surge',
            desc: 'Adds 3 independent resident upvotes, automatically advancing status to "Community Confirmed".',
            scenario: 'upvote_surge',
            label: 'Upvote Surge',
          ),
          const SizedBox(height: 10),

          // Scenario 3: RWA Resolution Action
          _buildActionCard(
            icon: Icons.check_circle_outline,
            color: AppTheme.emerald,
            title: 'Simulate RWA Resolution Fix',
            desc: 'Logs a technician fix note, marking issue resolved and updating the Health Score.',
            scenario: 'rwa_resolve',
            label: 'RWA Resolution',
          ),
          const SizedBox(height: 10),

          // Scenario 4: Clean Demo Data Reset
          _buildActionCard(
            icon: Icons.restart_alt_rounded,
            color: AppTheme.textMuted,
            title: 'Reset Demo Environment',
            desc: 'Restores standard baseline demo incidents across the neighbourhood.',
            scenario: 'reset_seed',
            label: 'Reset Environment',
            isSecondary: true,
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildActionCard({
    required IconData icon,
    required Color color,
    required String title,
    required String desc,
    required String scenario,
    required String label,
    bool isSecondary = false,
  }) {
    final isRunning = _runningAction == scenario;

    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: isSecondary ? AppTheme.backgroundLight : Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppTheme.borderLight),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Icon(icon, size: 16, color: color),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textDark,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  desc,
                  style: const TextStyle(fontSize: 10, color: AppTheme.textMuted),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          ElevatedButton(
            onPressed: _runningAction != null ? null : () => _runSimulation(scenario, label),
            style: ElevatedButton.styleFrom(
              backgroundColor: isSecondary ? Colors.grey.shade700 : color,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              minimumSize: const Size(60, 32),
            ),
            child: isRunning
                ? const SizedBox(
                    width: 12,
                    height: 12,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Text('Simulate', style: TextStyle(fontSize: 11)),
          ),
        ],
      ),
    );
  }
}
