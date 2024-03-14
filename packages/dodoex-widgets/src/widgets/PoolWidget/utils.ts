import { PoolApi, ExcludeNone, PoolType } from '@dodoex/api';
import { contractRequests } from '../../constants/api';
import { ChainId } from '../../constants/chains';
import { TokenInfo } from '../../hooks/Token';
import { PoolOperateProps } from './PoolOperate';

export const poolApi = new PoolApi({
  contractRequests,
});

export type FetchLiquidityListLqList = ExcludeNone<
  ReturnType<
    Exclude<typeof PoolApi.graphql.fetchLiquidityList['__apiType'], undefined>
  >['liquidity_list']
>['lqList'];

export function convertLiquidityTokenToTokenInfo(
  token:
    | {
        id: string;
        symbol: string;
        name: string;
        decimals: number;
        usdPrice: number;
        logoImg?: string | null;
      }
    | undefined,
  chainId: ChainId | number,
) {
  if (!token) return token;
  return {
    chainId: chainId,
    address: token.id,
    name: token.name,
    decimals: token.decimals,
    symbol: token.symbol,
    logoURI: token.logoImg ?? '',
  } as TokenInfo;
}

export function canOperatePool(
  account: string | undefined,
  {
    owner,
    creator,
    type,
  }: {
    owner?: string | null;
    creator?: string | null;
    type?: PoolType;
  },
): boolean {
  const actuallyOwner = owner ?? creator;
  return (
    type !== 'DPP' ||
    !!(
      account &&
      actuallyOwner &&
      actuallyOwner.toLocaleLowerCase() === account.toLocaleLowerCase()
    )
  );
}

export function convertFetchLiquidityToOperateData(
  lqData: ExcludeNone<FetchLiquidityListLqList>[0],
): PoolOperateProps['pool'] {
  const pair = lqData?.pair;
  if (!pair) return undefined;
  return {
    address: pair.id,
    chainId: pair.chainId,
    baseToken: convertLiquidityTokenToTokenInfo(
      pair.baseToken,
      pair.chainId,
    ) as TokenInfo,
    quoteToken: convertLiquidityTokenToTokenInfo(
      pair.quoteToken,
      pair.chainId,
    ) as TokenInfo,
    type: pair.type as PoolType,
  };
}
