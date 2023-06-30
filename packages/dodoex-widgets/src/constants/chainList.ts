import { ChainId } from './chains';
import { ReactComponent as ETHereumLogo } from '../assets/logo/networks/eth.svg';
import { ReactComponent as ArbitrumLogo } from '../assets/logo/networks/arbitrum.svg';
import { ReactComponent as PolygonLogo } from '../assets/logo/networks/polygon.svg';
import { ReactComponent as BSCLogo } from '../assets/logo/networks/bsc.svg';
import { ReactComponent as OptimismLogo } from '../assets/logo/networks/optimism.svg';
import { ReactComponent as AvalancheLogo } from '../assets/logo/networks/avalanche.svg';
import { ReactComponent as AuroraLogo } from '../assets/logo/networks/aurora.svg';
import { ReactComponent as OKChainLogo } from '../assets/logo/networks/okchain.svg';
import { ReactComponent as CFXLogo } from '../assets/logo/networks/cfx.svg';

export const chainListMap: {
  [key in ChainId]: {
    chainId: ChainId;
    logo: typeof ETHereumLogo;
    name: string;
    mainnet?: ChainId;
  };
} = {
  [ChainId.MAINNET]: {
    chainId: ChainId.MAINNET,
    logo: ETHereumLogo,
    name: 'Ethereum',
  },
  [ChainId.GOERLI]: {
    chainId: ChainId.GOERLI,
    logo: ETHereumLogo,
    name: 'Goerli',
    mainnet: ChainId.MAINNET,
  },
  [ChainId.ARBITRUM_ONE]: {
    chainId: ChainId.ARBITRUM_ONE,
    logo: ArbitrumLogo,
    name: 'Arbitrum',
  },
  [ChainId.POLYGON]: {
    chainId: ChainId.POLYGON,
    logo: PolygonLogo,
    name: 'Polygon',
  },
  [ChainId.BSC]: {
    chainId: ChainId.BSC,
    logo: BSCLogo,
    name: 'BNBChain',
  },
  [ChainId.OPTIMISM]: {
    chainId: ChainId.OPTIMISM,
    logo: OptimismLogo,
    name: 'Optimism',
  },
  [ChainId.AVALANCHE]: {
    chainId: ChainId.AVALANCHE,
    logo: AvalancheLogo,
    name: 'Avalanche',
  },
  [ChainId.AURORA]: {
    chainId: ChainId.AURORA,
    logo: AuroraLogo,
    name: 'Aurora',
  },
  [ChainId.OKCHAIN]: {
    chainId: ChainId.OKCHAIN,
    logo: OKChainLogo,
    name: 'OKTC',
  },
  [ChainId.CONFLUX]: {
    chainId: ChainId.CONFLUX,
    logo: CFXLogo,
    name: 'Conflux eSpace',
  },
};