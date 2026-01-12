import 'package:flutter/material.dart';
import '../controllers/monetization_controller_api.dart';

/// 金币余额显示组件
class CoinBalanceWidget extends StatelessWidget {
  final MonetizationControllerApi monetizationController;

  const CoinBalanceWidget({
    super.key,
    required this.monetizationController,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: monetizationController,
      builder: (context, child) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.amber.withOpacity(0.9),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.2),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.monetization_on,
                color: Colors.white,
                size: 18,
              ),
              const SizedBox(width: 6),
              Text(
                '${monetizationController.coins}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
