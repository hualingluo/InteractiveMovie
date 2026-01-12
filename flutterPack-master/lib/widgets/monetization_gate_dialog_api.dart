import 'package:flutter/material.dart';
import '../controllers/monetization_controller_api.dart';
import '../models/story_data.dart';

/// 变现门控弹窗 - API 版本（连接 Node.js 后端）
class MonetizationGateDialogApi extends StatefulWidget {
  final StoryNode targetNode;
  final MonetizationControllerApi monetizationController;
  final VoidCallback onUnlocked;

  const MonetizationGateDialogApi({
    super.key,
    required this.targetNode,
    required this.monetizationController,
    required this.onUnlocked,
  });

  @override
  State<MonetizationGateDialogApi> createState() => _MonetizationGateDialogApiState();
}

class _MonetizationGateDialogApiState extends State<MonetizationGateDialogApi> {
  String? _errorMessage;

  @override
  Widget build(BuildContext context) {
    final monetization = widget.targetNode.monetization;
    if (monetization == null) return const SizedBox();

    return AlertDialog(
      title: const Text('🔒 解锁章节'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.targetNode.title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            widget.targetNode.content,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
            ),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
          const Divider(height: 24),

          // 错误提示显示在弹窗内
          if (_errorMessage != null)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.red[50],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.red[200]!),
              ),
              child: Row(
                children: [
                  Icon(Icons.error_outline, color: Colors.red[700], size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _errorMessage!,
                      style: TextStyle(
                        color: Colors.red[900],
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),
            ),

          if (_errorMessage != null)
            const SizedBox(height: 12),

          if (monetization.type == 'paid') ...[
            _buildPaidContent(monetization),
          ] else if (monetization.type == 'ad') ...[
            _buildAdContent(monetization),
          ],
        ],
      ),
      actions: [
        TextButton(
          onPressed: widget.monetizationController.isLoading
              ? null
              : () => Navigator.pop(context),
          child: const Text('取消'),
        ),
        if (monetization.type == 'paid')
          ElevatedButton(
            onPressed: widget.monetizationController.isLoading
                ? null
                : () => _handleUnlockWithCoins(monetization.price!),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.amber,
              foregroundColor: Colors.black,
            ),
            child: widget.monetizationController.isLoading
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text('消耗 ${monetization.price} 金币解锁'),
          )
        else if (monetization.type == 'ad')
          ElevatedButton(
            onPressed: widget.monetizationController.isLoading
                ? null
                : () => _handleUnlockWithAd(),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue,
              foregroundColor: Colors.white,
            ),
            child: widget.monetizationController.isLoading
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Text('观看广告解锁'),
          ),
      ],
    );
  }

  Widget _buildPaidContent(Monetization monetization) {
    return AnimatedBuilder(
      animation: widget.monetizationController,
      builder: (context, child) {
        final coins = widget.monetizationController.coins;
        final price = monetization.price ?? 0;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.monetization_on, color: Colors.amber, size: 20),
                const SizedBox(width: 8),
                Text(
                  '需要 $price 金币',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.amber,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(Icons.account_balance_wallet, size: 16),
                const SizedBox(width: 8),
                Text(
                  '当前余额: $coins 金币',
                  style: const TextStyle(fontSize: 14),
                ),
              ],
            ),
            if (coins < price)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  '⚠️ 金币不足',
                  style: TextStyle(
                    color: Colors.red[700],
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
          ],
        );
      },
    );
  }

  Widget _buildAdContent(Monetization monetization) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Row(
          children: [
            Icon(Icons.play_circle_outline, color: Colors.blue, size: 20),
            SizedBox(width: 8),
            Text(
              '观看广告免费解锁',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.blue,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        if (monetization.adDescription != null && monetization.adDescription!.isNotEmpty)
          Text(
            monetization.adDescription!,
            style: TextStyle(
              fontSize: 13,
              color: Colors.grey[700],
              fontStyle: FontStyle.italic,
            ),
          ),
      ],
    );
  }

  void _handleUnlockWithCoins(int price) async {
    // 清除之前的错误提示
    setState(() => _errorMessage = null);

    final success = await widget.monetizationController.unlockWithCoins(
      widget.targetNode.id,
    );

    if (success) {
      if (mounted) {
        Navigator.pop(context);
        widget.onUnlocked();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ 解锁成功！'),
            duration: Duration(seconds: 2),
          ),
        );
      }
    } else {
      if (mounted) {
        // 解锁失败时，在弹窗内显示错误提示，不关闭弹窗
        setState(() => _errorMessage = widget.monetizationController.errorMessage ?? '❌ 解锁失败');
      }
    }
  }

  void _handleUnlockWithAd() async {
    // 清除之前的错误提示
    setState(() => _errorMessage = null);

    final success = await widget.monetizationController.unlockWithAd(
      widget.targetNode.id,
    );

    if (success) {
      if (mounted) {
        Navigator.pop(context);
        widget.onUnlocked();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ 广告观看完成，解锁成功！'),
            duration: Duration(seconds: 2),
          ),
        );
      }
    } else {
      if (mounted) {
        // 解锁失败时，在弹窗内显示错误提示，不关闭弹窗
        setState(() => _errorMessage = widget.monetizationController.errorMessage ?? '❌ 解锁失败');
      }
    }
  }
}

/// 显示变现门控弹窗的辅助函数 - API 版本
Future<void> showMonetizationGateApi({
  required BuildContext context,
  required StoryNode targetNode,
  required MonetizationControllerApi monetizationController,
  required VoidCallback onUnlocked,
}) {
  return showDialog(
    context: context,
    builder: (context) => MonetizationGateDialogApi(
      targetNode: targetNode,
      monetizationController: monetizationController,
      onUnlocked: onUnlocked,
    ),
  );
}
