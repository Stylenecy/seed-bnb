#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
#  bsc-register-gift-boxes.sh — register the 24 baked gift boxes on BNB Chain
# ─────────────────────────────────────────────────────────────────────────
#
# BSC port of legacy-initia/re-register-gift-boxes-baked.sh (same box data).
# Calls IPayGiftPool.registerBox(uint64,string,uint256,uint256,string[],bool)
# with Foundry's `cast`. The caller must be a gift-pool owner.
#
# Usage:
#   BSC_RPC_URL=https://data-seed-prebsc-1-s1.bnbchain.org:8545 \
#   GIFT_POOL_ADDRESS=0x... DEPLOYER_PK=0x... \
#     bash scripts/deploy/bsc-register-gift-boxes.sh
#
# BOX_AMOUNT is in token base units (18 decimals on BSC); 0 = flexible.
# DRY_RUN=1 prints the commands only.
set -euo pipefail

: "${GIFT_POOL_ADDRESS:?set GIFT_POOL_ADDRESS}"
: "${BSC_RPC_URL:?set BSC_RPC_URL}"
BOX_AMOUNT="${BOX_AMOUNT:-0}"
BOX_FEE_BPS="${BOX_FEE_BPS:-50}"
OK=0; FAIL_IDS=()

register_box() {
  local ID="$1" NAME="$2" URLS="$3"
  echo "▶ Box #$ID: $NAME"
  if [ "${DRY_RUN:-0}" = "1" ]; then
    echo "  cast send $GIFT_POOL_ADDRESS registerBox(...) $ID \"$NAME\" $BOX_AMOUNT $BOX_FEE_BPS [$URLS] true"
    OK=$((OK + 1)); return 0
  fi
  : "${DEPLOYER_PK:?set DEPLOYER_PK}"
  if cast send "$GIFT_POOL_ADDRESS" \
      "registerBox(uint64,string,uint256,uint256,string[],bool)" \
      "$ID" "$NAME" "$BOX_AMOUNT" "$BOX_FEE_BPS" "[$URLS]" true \
      --rpc-url "$BSC_RPC_URL" --private-key "$DEPLOYER_PK" >/dev/null; then
    OK=$((OK + 1))
  else
    FAIL_IDS+=("$ID")
  fi
}

register_box '1' 'Music Box' 'https://iusd-pay.xyz/images/gifts/box_1_0.jpg,https://iusd-pay.xyz/images/gifts/box_1_2.jpg'
register_box '2' 'FLY Coffee' 'https://iusd-pay.xyz/images/gifts/image__6__3e599dd35c5b.jpg'
register_box '3' 'Repeating watch' 'https://iusd-pay.xyz/images/gifts/box_3_0.jpg,https://iusd-pay.xyz/images/gifts/box_3_2.jpg,https://iusd-pay.xyz/images/gifts/box_3_3.jpg,https://iusd-pay.xyz/images/gifts/box_3_4.jpg'
register_box '4' 'Guitar' 'https://iusd-pay.xyz/images/gifts/box_4_0.jpg'
register_box '5' 'Music Box' 'https://iusd-pay.xyz/images/gifts/box_5_0.jpg,https://iusd-pay.xyz/images/gifts/box_5_2.jpg,https://iusd-pay.xyz/images/gifts/box_5_3.jpg'
register_box '6' 'Guitar' 'https://iusd-pay.xyz/images/gifts/box_6_0.jpg,https://iusd-pay.xyz/images/gifts/box_6_2.jpg,https://iusd-pay.xyz/images/gifts/box_6_3.jpg,https://iusd-pay.xyz/images/gifts/box_6_4.jpg'
register_box '7' 'Winter Morning in the Country' 'https://iusd-pay.xyz/images/gifts/box_7_0.jpg'
register_box '8' 'Give Me Liberty or Give Me Death!' 'https://iusd-pay.xyz/images/gifts/box_8_0.jpg'
register_box '9' 'Music Box' 'https://iusd-pay.xyz/images/gifts/box_9_0.jpg,https://iusd-pay.xyz/images/gifts/box_9_2.jpg'
register_box '10' 'Watch case' 'https://iusd-pay.xyz/images/gifts/box_10_0.jpg,https://iusd-pay.xyz/images/gifts/box_10_2.jpg'
register_box '11' 'Division Viol' 'https://iusd-pay.xyz/images/gifts/box_11_0.jpg,https://iusd-pay.xyz/images/gifts/box_11_2.jpg,https://iusd-pay.xyz/images/gifts/box_11_3.jpg,https://iusd-pay.xyz/images/gifts/box_11_4.jpg'
register_box '12' 'Dragon' 'https://iusd-pay.xyz/images/gifts/box_12_0.jpg,https://iusd-pay.xyz/images/gifts/box_12_3.jpg'
register_box '13' 'Roses and Lilies' 'https://iusd-pay.xyz/images/gifts/box_13_0.jpg'
register_box '14' 'Watch' 'https://iusd-pay.xyz/images/gifts/box_14_0.jpg,https://iusd-pay.xyz/images/gifts/box_14_2.jpg,https://iusd-pay.xyz/images/gifts/box_14_3.jpg,https://iusd-pay.xyz/images/gifts/box_14_4.jpg'
register_box '15' 'Dragonfly brooch' 'https://iusd-pay.xyz/images/gifts/box_15_0.jpg,https://iusd-pay.xyz/images/gifts/box_15_2.jpg,https://iusd-pay.xyz/images/gifts/box_15_3.jpg,https://iusd-pay.xyz/images/gifts/box_15_4.jpg'
register_box '16' 'Armlet' 'https://iusd-pay.xyz/images/gifts/box_16_0.jpg,https://iusd-pay.xyz/images/gifts/box_16_3.jpg,https://iusd-pay.xyz/images/gifts/box_16_4.jpg'
register_box '17' 'Armor Garniture of George Clifford' 'https://iusd-pay.xyz/images/gifts/box_17_0.jpg,https://iusd-pay.xyz/images/gifts/box_17_2.jpg,https://iusd-pay.xyz/images/gifts/box_17_3.jpg,https://iusd-pay.xyz/images/gifts/box_17_4.jpg'
register_box '18' 'Brooch in the form of an owl head' 'https://iusd-pay.xyz/images/gifts/box_18_0.jpg,https://iusd-pay.xyz/images/gifts/box_18_2.jpg'
register_box '19' 'Watch' 'https://iusd-pay.xyz/images/gifts/box_19_0.jpg,https://iusd-pay.xyz/images/gifts/box_19_2.jpg,https://iusd-pay.xyz/images/gifts/box_19_3.jpg'
register_box '20' 'Irises' 'https://iusd-pay.xyz/images/gifts/box_20_0.jpg'
register_box '21' 'Sugar bowl with cover' 'https://iusd-pay.xyz/images/gifts/box_21_0.jpg,https://iusd-pay.xyz/images/gifts/box_21_2.jpg,https://iusd-pay.xyz/images/gifts/box_21_3.jpg,https://iusd-pay.xyz/images/gifts/box_21_4.jpg'
register_box '22' 'Ewer' 'https://iusd-pay.xyz/images/gifts/box_22_0.jpg,https://iusd-pay.xyz/images/gifts/box_22_2.jpg,https://iusd-pay.xyz/images/gifts/box_22_3.jpg,https://iusd-pay.xyz/images/gifts/box_22_4.jpg'
register_box '23' 'The Actor Asao Gakujūrō I as Mashiba Hisatsugu' 'https://iusd-pay.xyz/images/gifts/box_23_0.jpg'
register_box '24' 'the Crown of the Andes' 'https://iusd-pay.xyz/images/gifts/12_copy_9af58e89eb26.jpg'

echo "Registered: $OK / 24"
[ "${#FAIL_IDS[@]}" -gt 0 ] && echo "Failed box ids: ${FAIL_IDS[*]}" || true
