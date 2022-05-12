import { Token } from "../types/schema";
import { UniswapFactory as UniswapFactoryContract } from "../types/AmplifyFactory/UniswapFactory";
import { UniswapRouter as UniswapRouterContract } from "../types/templates/UniswapPair/UniswapRouter";
import { BigDecimal, Address, BigInt, Value } from "@graphprotocol/graph-ts/index";
import { ZERO_BD, ADDRESS_ZERO, ONE_BD } from "./helpers";
import { WETH_ADDRESS, STABLE_TOKEN } from "./constants";
import { convertTokenToDecimal } from "./helpers";
import { UniswapPair as PairContract } from "../types/templates/UniswapPair/UniswapPair";
import { ERC20 } from "../types/templates/UniswapPair/ERC20";
import { log } from '@graphprotocol/graph-ts'

const MEERKAT_ROUTER_ADDRESS = Address.fromString('0x145677FC4d9b8F19B5D56d1820c48e0443049a30');

function getRelativePrice(
  pairAddress: Address,
  tokenAddress: String
): BigDecimal {
  let pairContract = PairContract.bind(pairAddress);
  let reserves = pairContract.getReserves();
  let token0 = pairContract.token0();
  let token1 = pairContract.token1();
  let token0Contract = ERC20.bind(token0);
  let token1Contract = ERC20.bind(token1);
  let decimals0 = token0Contract.decimals();
  let decimals1 = token1Contract.decimals();
  let reserve0 = convertTokenToDecimal(
    reserves.value0,
    BigInt.fromI32(decimals0)
  );
  let reserve1 = convertTokenToDecimal(
    reserves.value1,
    BigInt.fromI32(decimals1)
  );
  if (token0.toHexString() == tokenAddress) {
    return reserve1.div(reserve0);
  } else {
    return reserve0.div(reserve1);
  }
}

export function getEthPriceInUSD(
  uniswapFactoryContract: UniswapFactoryContract
): BigDecimal {
  let pairAddress = uniswapFactoryContract.getPair(
    Address.fromString(STABLE_TOKEN),
    Address.fromString(WETH_ADDRESS)
  );
  if (pairAddress.toHexString() == ADDRESS_ZERO) {
    throw new Error('ERROR: Why is the stable address O');
  };
  return getRelativePrice(pairAddress, WETH_ADDRESS);
}

export function findEthPerToken(
  uniswapFactoryContract: UniswapFactoryContract,
  token: Token
): BigDecimal {
  if (token.id == WETH_ADDRESS) {
    return ONE_BD;
  }
  
  if (token.symbol == 'TIGER' || token.symbol == 'LION') {
    let uniswapRouter = UniswapRouterContract.bind(MEERKAT_ROUTER_ADDRESS);
    const outputAmount = BigInt.fromString('1000000000000');
    const inputAmount = uniswapRouter.getAmountsIn(outputAmount, [
      Address.fromString('0x5c7f8a570d578ed84e63fdfa7b1ee72deae1ae23'),
      Address.fromString('0x654bac3ec77d6db497892478f854cf6e8245dca9'),
      Address.fromString(token.id),
    ])[0];
    if (token.symbol == 'LION') {
      return convertTokenToDecimal(
        outputAmount, BigInt.fromString('18')
      ).div(convertTokenToDecimal(inputAmount, BigInt.fromString('18')));  
    }
    return convertTokenToDecimal(
      inputAmount, BigInt.fromString('18')
    ).div(convertTokenToDecimal(outputAmount, BigInt.fromString('18')));
  }

  let pairAddress = uniswapFactoryContract.getPair(
    Address.fromString(token.id),
    Address.fromString(WETH_ADDRESS)
  );
  if (pairAddress.toHexString() == ADDRESS_ZERO) {
    return ZERO_BD;
  } else {
    return getRelativePrice(pairAddress, token.id);
  }
}
