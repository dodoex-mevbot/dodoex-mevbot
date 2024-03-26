import { Button, Box, useTheme } from '@dodoex/components';
import { t, Trans } from '@lingui/macro';
import { useMutation } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';
import { Dispatch, useState } from 'react';
import NeedConnectButton from '../../../../components/ConnectWallet/NeedConnectButton';
import TokenStatusButton from '../../../../components/TokenStatusButton';
import { useWalletInfo } from '../../../../hooks/ConnectWallet/useWalletInfo';
import { useWidgetDevice } from '../../../../hooks/style/useWidgetDevice';
import { useSubmission } from '../../../../hooks/Submission';
import { OpCode } from '../../../../hooks/Submission/spec';
import {
  ExecutionResult,
  MetadataFlag,
} from '../../../../hooks/Submission/types';
import { useTokenStatus } from '../../../../hooks/Token/useTokenStatus';
import { useRouterStore } from '../../../../router';
import { PageType } from '../../../../router/types';
import { PoolTab } from '../../list/hooks/usePoolListTabs';
import ConfirmInfoDialog from '../components/ConfirmInfoDialog';
import { useCreatePoolSubmit } from '../hooks/contract/useCreatePoolSubmit';
import { Actions, StateProps, Types } from '../reducer';
import { Version } from '../types';
import {
  DEFAULT_SLIPPAGE_COEFFICIENT,
  MAX_SLIPPAGE_COEFFICIENT_PEGGED,
  MAX_FEE_RATE,
  MAX_INIT_PRICE,
  MIN_FEE_RATE,
} from '../utils';

function OperateBtn({
  state,
  dispatch,
  openConfirm,
}: {
  state: StateProps;
  dispatch: Dispatch<Actions>;
  openConfirm: () => void;
}) {
  const {
    currentStep,
    selectedVersion,
    baseToken,
    quoteToken,
    baseAmount,
    quoteAmount,
    initPrice,
    slippageCoefficient,
    feeRate,
  } = state;

  const baseAmountBN = new BigNumber(baseAmount || 0);
  const quoteAmountBN = new BigNumber(quoteAmount || 0);

  const baseTokenStatus = useTokenStatus(baseToken, {
    amount: baseAmount,
  });
  const buttonProps = {
    variant: Button.Variant.contained,
  };

  const nextButtonText = t`Next`;

  const disabledButton = (
    <Button fullWidth disabled {...buttonProps}>
      {nextButtonText}
    </Button>
  );

  if (currentStep === 0) {
    return (
      <Button
        fullWidth
        {...buttonProps}
        onClick={() => {
          dispatch({
            type: Types.SetCurrentStep,
            payload: 1,
          });
        }}
      >
        {nextButtonText}
      </Button>
    );
  }
  if (currentStep === 1) {
    if (
      !baseToken ||
      !quoteToken ||
      baseAmountBN.isNaN() ||
      baseAmountBN.lte(0)
    ) {
      return disabledButton;
    }
    if (
      baseTokenStatus.needShowTokenStatusButton ||
      baseTokenStatus.insufficientBalance
    ) {
      return (
        <TokenStatusButton status={baseTokenStatus} buttonProps={buttonProps} />
      );
    }
    if (selectedVersion !== Version.singleToken) {
      if (!quoteToken || quoteAmountBN.isNaN() || quoteAmountBN.lte(0)) {
        return disabledButton;
      }
      if (
        baseTokenStatus.needShowTokenStatusButton ||
        baseTokenStatus.insufficientBalance
      ) {
        return (
          <TokenStatusButton
            status={baseTokenStatus}
            buttonProps={buttonProps}
          />
        );
      }
    }

    const initPriceBN = new BigNumber(initPrice);
    const decimalsLimit = Math.min(quoteToken.decimals, 16);
    if (
      !initPrice ||
      initPriceBN.isNaN() ||
      initPriceBN.lt(`1e-${decimalsLimit}`) ||
      initPriceBN.gt(MAX_INIT_PRICE)
    ) {
      return disabledButton;
    }

    if (state.selectedVersion !== Version.standard) {
      const slippageCoefficientBN = new BigNumber(slippageCoefficient);
      if (
        !slippageCoefficient ||
        slippageCoefficientBN.isNaN() ||
        slippageCoefficientBN.lt(0) ||
        slippageCoefficientBN.gt(
          selectedVersion === Version.pegged
            ? MAX_SLIPPAGE_COEFFICIENT_PEGGED
            : DEFAULT_SLIPPAGE_COEFFICIENT,
        )
      ) {
        return disabledButton;
      }
    }

    return (
      <Button
        fullWidth
        {...buttonProps}
        onClick={() => {
          dispatch({
            type: Types.SetCurrentStep,
            payload: 2,
          });
        }}
      >
        {nextButtonText}
      </Button>
    );
  }
  if (currentStep === 2) {
    const feeRateBN = new BigNumber(feeRate);
    if (
      !feeRate ||
      feeRateBN.isNaN() ||
      feeRateBN.lt(MIN_FEE_RATE) ||
      feeRateBN.gt(MAX_FEE_RATE)
    ) {
      return disabledButton;
    }
    return (
      <Button
        variant={Button.Variant.contained}
        fullWidth
        onClick={openConfirm}
      >
        <Trans>Create</Trans>
      </Button>
    );
  }
  return null;
}

export function BottomButtonGroup({
  state,
  dispatch,
}: {
  state: StateProps;
  dispatch: Dispatch<Actions>;
}) {
  const { currentStep, baseAmount, quoteAmount } = state;

  const theme = useTheme();
  const { isMobile } = useWidgetDevice();
  const submission = useSubmission();

  const { chainId } = useWalletInfo();

  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  const { getCreateParams } = useCreatePoolSubmit(state);

  const createPoolMutation = useMutation({
    mutationFn: async () => {
      const params = await getCreateParams();
      if (!params) {
        return;
      }

      const succ = await submission.execute(
        t`Pool Creation`,
        {
          opcode: OpCode.TX,
          desc: 'Create pool',
          ...params,
        },
        {
          metadata: {
            [state.selectedVersion === Version.marketMakerPool
              ? MetadataFlag.createDPPPool
              : state.selectedVersion === Version.pegged
              ? MetadataFlag.createDSPPool
              : MetadataFlag.createDVMPool]: '1',
          },
        },
      );
      if (succ === ExecutionResult.Submitted) {
        useRouterStore.getState().push({
          type: PageType.Pool,
          params: {
            tab: PoolTab.myCreated,
          },
        });
      }
    },
  });

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme.palette.background.paperContrast,
          px: 20,
          py: 20,
          [theme.breakpoints.up('tablet')]: {
            position: 'static',
            backgroundColor: 'transparent',
            py: 0,
          },
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {currentStep === 0 && isMobile && (
          <Button
            variant={Button.Variant.second}
            fullWidth
            onClick={() => {
              useRouterStore.getState().back();
            }}
          >
            <Trans>Cancel</Trans>
          </Button>
        )}

        {(currentStep === 1 || currentStep === 2) && (
          <Button
            variant={Button.Variant.second}
            fullWidth
            onClick={() => {
              dispatch({
                type: Types.SetCurrentStep,
                payload: (currentStep - 1) as 0 | 1,
              });
            }}
          >
            <Trans>Back</Trans>
          </Button>
        )}

        <NeedConnectButton
          chainId={chainId}
          variant={Button.Variant.contained}
          fullWidth
          includeButton
        >
          <OperateBtn
            state={state}
            dispatch={dispatch}
            openConfirm={() => {
              setConfirmModalVisible(true);
            }}
          />
        </NeedConnectButton>
      </Box>

      <ConfirmInfoDialog
        on={confirmModalVisible}
        onClose={() => setConfirmModalVisible(false)}
        state={state}
        isModify={false}
        onConfirm={createPoolMutation.mutate}
      />
    </>
  );
}
