import { Token } from "../types/schema";
import { UniswapFactory as UniswapFactoryContract } from "../types/EleosFactory/UniswapFactory";
import { BigDecimal, Address, BigInt } from "@graphprotocol/graph-ts/index";
import { ZERO_BD, ADDRESS_ZERO, ONE_BD } from "./helpers";
import { WETH_ADDRESS, STABLE_TOKEN } from "./constants";
import { convertTokenToDecimal } from "./helpers";
import { UniswapPair as PairContract } from "../types/templates/UniswapPair/UniswapPair";
import { ERC20 } from "../types/templates/UniswapPair/ERC20";
import { log } from '@graphprotocol/graph-ts'


function getRelativePrice(
  pairAddress: Address,
  tokenAddress: String
): BigDecimal {
  let pairContract = PairContract.bind(pairAddress);
  log.critical('oh shit', []);
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
  return ONE_BD;
}

export function getEthPriceInUSD(
  uniswapFactoryContract: UniswapFactoryContract
): BigDecimal {
  let pairAddress = uniswapFactoryContract.getPair(
    Address.fromString(STABLE_TOKEN),
    Address.fromString(WETH_ADDRESS)
  );
  log.warning('Pair address that probably shouldnt be 0: {}', [pairAddress.toHexString()]);
  if (pairAddress.toHexString() == ADDRESS_ZERO) {
    throw new Error('Why is the stable address O!?!?!?!?!?!');
  };
  throw new Error('Why is the stable address O!?!?!?!?!?!');
  return getRelativePrice(pairAddress, WETH_ADDRESS);
}

export function findEthPerToken(
  uniswapFactoryContract: UniswapFactoryContract,
  token: Token
): BigDecimal {
  log.error('whats tthe WETH AT {}', [WETH_ADDRESS.toString()])
  if (token.id == WETH_ADDRESS) {
    return ONE_BD;
  }
  let pairAddress = uniswapFactoryContract.getPair(
    Address.fromString(token.id),
    Address.fromString(WETH_ADDRESS)
  );
  if (pairAddress.toHexString() == ADDRESS_ZERO) return ZERO_BD;
  return getRelativePrice(pairAddress, token.id);
}
