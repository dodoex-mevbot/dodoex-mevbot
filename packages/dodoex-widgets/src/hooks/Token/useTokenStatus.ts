import { basicTokenMap, ChainId, contractConfig } from '@dodoex/api';
import { t } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useQuery } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';
import React from 'react';
import { tokenApi } from '../../constants/api';
import { getTokenSymbolDisplay } from '../../utils/token';
import { useWalletInfo } from '../ConnectWallet/useWalletInfo';
import { useInflights, useSubmission } from '../Submission';
import { OpCode } from '../Submission/spec';
import { ExecutionResult } from '../Submission/types';
import { ApprovalState, TokenInfo } from './type';

function getPendingRest(
  token: TokenInfo | undefined | null,
  allowance: BigNumber | undefined,
) {
  const isUSDT =
    token?.symbol === 'USDT' ||
    token?.address.toLowerCase() ===
      '0x6426e6017968377529487E0ef0aA4E7759724e05'.toLowerCase();
  return isUSDT && allowance && allowance.gt(0);
}

export function useTokenStatus(
  token: TokenInfo | undefined | null,
  {
    amount,
    contractAddress,
    offset,
    overrideBalance,
  }: {
    amount?: string | number | BigNumber;
    contractAddress?: string;
    offset?: BigNumber;
    overrideBalance?: BigNumber | null;
  } = {},
) {
  const { account } = useWalletInfo();
  const [chainId, proxyContractAddress] = React.useMemo(() => {
    if (!token) return [undefined, contractAddress];
    return [
      token.chainId,
      contractAddress ?? contractConfig[token.chainId as ChainId].DODO_APPROVE,
    ];
  }, [token, contractAddress]) as [number | undefined, string | undefined];
  const tokenQuery = useQuery(
    tokenApi.getFetchTokenQuery(
      chainId,
      token?.address,
      account,
      proxyContractAddress,
    ),
  );
  const { runningRequests } = useInflights();
  const { i18n } = useLingui();
  const basicTokenAddress = React.useMemo(
    () => (chainId ? basicTokenMap[chainId as ChainId]?.address : null),
    [chainId],
  );

  const getApprovalState = React.useCallback(() => {
    if (!token) {
      return ApprovalState.Loading;
    }
    const isApproving = runningRequests.some(
      (k) =>
        k.spec?.opcode === OpCode.Approval &&
        k.spec?.token.address === token?.address &&
        k.spec?.contract === proxyContractAddress,
    );
    const balance = overrideBalance ?? tokenQuery.data?.balance;
    const allowance = tokenQuery.data?.allowance;

    const parsed = new BigNumber(amount || 0);
    if (!account) return ApprovalState.Unchecked;
    if (!balance || parsed.minus(offset ?? 0).gt(balance))
      return ApprovalState.Unchecked;

    if (parsed.isZero()) return ApprovalState.Unchecked;
    const isBasicToken = token.address === basicTokenAddress;
    if (isBasicToken) return ApprovalState.Sufficient;
    if (isApproving) return ApprovalState.Approving;
    if (!allowance) {
      return ApprovalState.Loading;
    }
    if (parsed.minus(offset ?? 0).gt(allowance))
      return ApprovalState.Insufficient;
    return ApprovalState.Sufficient;
  }, [
    runningRequests,
    account,
    offset,
    basicTokenAddress,
    tokenQuery.data,
    token,
    overrideBalance,
    amount,
  ]);

  const { isApproving, isGetApproveLoading, needApprove, needReset } =
    React.useMemo(() => {
      const approvalState = getApprovalState();
      const pendingReset = getPendingRest(token, tokenQuery.data?.allowance);
      return {
        isApproving: approvalState === ApprovalState.Approving,
        isGetApproveLoading:
          approvalState === ApprovalState.Loading || tokenQuery.isLoading,
        needApprove:
          approvalState === ApprovalState.Insufficient && !pendingReset,
        needReset: approvalState === ApprovalState.Insufficient && pendingReset,
      };
    }, [tokenQuery.data, tokenQuery.isLoading, getApprovalState, token]);

  const submission = useSubmission();
  const submitApprove = React.useCallback(async () => {
    if (!proxyContractAddress || !account || !token) return;
    const tokenDisp = getTokenSymbolDisplay(token);
    const amt = needReset ? new BigNumber(0) : undefined;
    const prefix = needReset ? t`Reset` : t`Approve`;
    const result = await submission.execute(`${prefix} ${tokenDisp}`, {
      opcode: OpCode.Approval,
      token,
      contract: proxyContractAddress,
      amt,
    });

    if (result !== ExecutionResult.Success) return;
  }, [
    proxyContractAddress,
    account,
    chainId,
    submission,
    token,
    needReset,
    i18n._,
  ]);

  const getMaxBalance = React.useCallback(() => {
    const defaultVal = new BigNumber(0);
    if (!token) return defaultVal.toString(); // Use toString instead of toNumber to avoid missing decimals!
    const balance = tokenQuery.data?.balance;
    if (!balance) return defaultVal.toString();
    let val = balance;
    // const keepChanges = isETH ? 0.1 : 0.02;
    // const isBasicToken = basicTokenAddress === token?.address;
    // if (isBasicToken)
    //   val = balance.gt(keepChanges) ? balance.minus(keepChanges) : defaultVal;

    return val.toString();
  }, [chainId, tokenQuery.data?.balance, token]);

  const insufficientBalance = React.useMemo(() => {
    if (!amount) return false;
    const balance = tokenQuery.data?.balance ?? new BigNumber(0);
    return balance.lt(amount);
  }, [tokenQuery.data?.balance, amount]);

  return {
    isApproving,
    isGetApproveLoading,
    needApprove,
    needReset,
    insufficientBalance,
    loading: tokenQuery.isLoading,
    submitApprove,
    getMaxBalance,
  };
}