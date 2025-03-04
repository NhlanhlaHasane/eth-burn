import {
  Box,
  Center,
  Divider,
  Flex,
  Heading,
  HStack,
  Link,
  Text,
  Tooltip,
  useRadio,
  useRadioGroup,
  UseRadioProps,
  VStack,
} from "@chakra-ui/react";
import { ethers, utils } from "ethers";
import React from "react";
import { Link as ReactLink } from "react-router-dom";
import { BlockProgress } from "../components/BlockProgress";
import { Card } from "../components/Card";
import { FirePit } from "../components/FirePit";
import { Footer } from "../components/Footer";
import { Loader } from "../components/Loader";
import { EthereumNetworkBadge } from "../components/Network";
import {
  BlockExplorerSession,
  BurnedBlockTransaction,
  useBlockExplorer,
} from "../contexts/BlockExplorerContext";
import { Currency, CurrencyProvider, useCurrency } from "../contexts/CurrencyContext";
import { timeSince } from "../utils/time";
import { formatBigNumber } from "../utils/wei";

interface BlockItemProps {
  number: number;
  timestamp: number;
  burned: ethers.BigNumber;
  basefee: ethers.BigNumber;
  gasLimit: ethers.BigNumber;
  gasUsed: ethers.BigNumber;
  currency: Currency;
  amount: number
}

function BlockItem(props: BlockItemProps) {
  const symbol = props.currency === 'ETH' ? '' : '$'
  const totalBurned = symbol + utils.commify(utils.formatEther(props.burned.mul(props.amount)).substr(0, 8))

  const label = (
    <Text>
      Burned: {formatBigNumber(props.burned, 'ether')} ETH
      <br />
      Base Fee: {formatBigNumber(props.basefee, 'wei')} wei
      <br />
      Gas used: {((props.gasUsed.toNumber() / props.gasLimit.toNumber()) * 100).toFixed(2)}%
    </Text>
  );

  return (
    <HStack m="2">
      <Flex flex="1" align="flex-start" direction="column">
        <Box>
          <Link as={ReactLink} to={`/block/${props.number}`}>
            Block {props.number}
          </Link>
        </Box>
        <Box fontSize="14px" mt="0" color="brand.secondaryText">
          {timeSince(props.timestamp)}
        </Box>
      </Flex>
      <HStack
        bg="brand.subheaderCard"
        pl="4"
        pr="4"
        pt="2"
        pb="2"
        rounded="full"
        align="center"
      >
        <FirePit size="12px" />
        <Box w="70px" whiteSpace="nowrap">
          <Tooltip hasArrow label={label} placement="right">
            {totalBurned}
          </Tooltip>
        </Box>
      </HStack>
    </HStack>
  );
}

interface CurrentBlockProps {
  block: BurnedBlockTransaction;
}

function CurrentBlock(props: CurrentBlockProps) {
  return (
    <HStack m="2">
      <Flex flex="1" align="flex-start" direction="column">
        <Box>Block {props.block.number + 1}</Box>
        <Box fontSize="14px" mt="0" color="brand.secondaryText">
          pending
        </Box>
      </Flex>
      <HStack
        bg="brand.subheaderCard"
        pl="4"
        pr="4"
        pt="2"
        pb="2"
        rounded="full"
        align="center"
      >
        <BlockProgress
          w="90px"
          h="24px"
        />
      </HStack>
    </HStack>
  );
}

interface LatestBlocksProps {
  latestBlock: BurnedBlockTransaction;
  renderedBlocks: BurnedBlockTransaction[];
}

function LatestBlocksCard(props: LatestBlocksProps) {
  const { currency, amount } = useCurrency()
  const { latestBlock, renderedBlocks } = props

  if (!currency || !amount)
    return null
    
  return (
    <Card bg="brand.card" zIndex={2} p="4" w="100%">
      <Heading size="sm" textAlign="center" color="brand.headerText">
        Latest Blocks
      </Heading>
      <CurrentBlock block={latestBlock} />
      <Divider bg="brand.card" borderColor="brand.card" />
      {renderedBlocks.map((block, idx) => (
        <BlockItem key={idx} {...block} currency={currency} amount={amount}/>
      ))}

      <Divider bg="brand.card" borderColor="brand.card" />

      <Link
        as={ReactLink}
        to="/blocks"
        mt="4"
        textAlign="center"
        zIndex={2}
        size="sm"
      >
        View all blocks
      </Link>
    </Card>
  )
}

interface SessionSummaryProps {
  session: BlockExplorerSession
}

function SessionSummaryCard(props: SessionSummaryProps) {
  const { currency, amount } = useCurrency()
  if (!currency || !amount)
    return null

  const symbol = currency === 'ETH' ? '' : '$'
  const sessionTotalBurned = symbol + formatBigNumber(props.session.burned.mul(amount), 'ether') + ' ' + currency
  const sessionTotalRewards = symbol + formatBigNumber(props.session.rewards.mul(amount), 'ether') + ' ' + currency

  return (
    <Card>
      <Heading size="sm" textAlign="center" color="brand.headerText">
        Session Summary
      </Heading>
      <Text color="brand.primaryText" textAlign="left" mt="2" p="4">
        You've just experienced <strong>{sessionTotalBurned}</strong> being burned by observing <strong>{props.session.blockCount} blocks</strong>
        {" "}that contain <strong>{props.session.transactionCount} transactions</strong> with <strong>{sessionTotalRewards}</strong> rewards!
      </Text>
    </Card>
  )
}

interface CurrencySelectorCardProps extends UseRadioProps {
  children: React.ReactNode;
}

function CurrencySelectorCard(props: CurrencySelectorCardProps) {
  const { getInputProps, getCheckboxProps } = useRadio(props)
  const input = getInputProps()
  const checkbox = getCheckboxProps()

  return (
    <Box as="label">
      <input {...input} />
      <Box
        {...checkbox}
        cursor="pointer"
        fontWeight="bold"
        _checked={{
          color: "brand.orange",
        }}
        _focus={{
          boxShadow: "outline",
        }}
      >
        {props.children}
      </Box>
    </Box>
  )
}

interface TotalFeesCardProps {
  totalBurned: ethers.BigNumber
}

function TotalFeesCard(props: TotalFeesCardProps) {
  const state = useCurrency()
  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "currency",
    defaultValue: "ETH",
    onChange: (e: Currency) => state.setCurrency(e)
  })

  if (!state.currency || !state.amount)
    return null

  const group = getRootProps()
  const options = ["ETH", "USD"]

  const isEthereumCurrency = state.currency === 'ETH'
  const symbol = isEthereumCurrency ? '' : '$'
  const totalBurnedInEth = utils.formatEther(props.totalBurned.mul(state.amount));
  const totalBurnedSplitter = totalBurnedInEth.indexOf(".");
  const totalBurnedWholeNumber = symbol + utils.commify(totalBurnedInEth.substr(0, totalBurnedSplitter));
  const totalBurnedDecimalNumber = totalBurnedInEth.substr(totalBurnedSplitter + 1, isEthereumCurrency ? 6 : 2);

  return (
    <Card bg="brand.card" zIndex={2} p="4" w="100%" textAlign="center">
      <Heading size="sm" color="brand.headerText">
        Total Fees Burned
      </Heading>
      <HStack
        alignItems="baseline"
        overflow="hidden"
        wordBreak="break-all"
        whiteSpace="nowrap"
        justify="center"
      >
        <Text fontSize={["48px", "64px", "90px"]} fontWeight="bold">
          {totalBurnedWholeNumber}.
        </Text>
        <Text fontSize={["24px", "32px", "48px"]}>
          {totalBurnedDecimalNumber}
        </Text>
        <Text fontSize={["18px", "22px", "32px"]} color="brand.orange">
          {state.currency}
        </Text>
      </HStack>
      <HStack {...group} justify="center">
        {options.map((value) => {
          const radio = getRadioProps({ value })
          return (
            <CurrencySelectorCard key={value} {...radio}>
              {value}
            </CurrencySelectorCard>
          )
        })}
      </HStack>
    </Card>
  )
}

function FireAnimation() {
  return (
    <Center position="fixed" bottom="0" fontSize={["50px", "80px", "100px"]}>
      <FirePit
        size="0.8em"
        sparkCount={12}
        zIndex={1}
        position="absolute"
        bottom="0"
      />
      <FirePit
        size="0.4em"
        ml="-1.8em"
        sparkCount={12}
        zIndex={1}
        position="absolute"
        bottom="0"
      />
      <FirePit
        size="0.4em"
        ml="1.8em"
        sparkCount={12}
        zIndex={1}
        position="absolute"
        bottom="0"
      />
    </Center>
  )
}

function Header() {
  return (
    <Box mt="2" mb="2" textAlign="left" w="100%" position="relative">
      <Box>
        <Heading>
          <HStack>
            <Text>Watch The</Text>
            <Box display="inline" color="brand.orange">
              Burn
            </Box>
          </HStack>
        </Heading>
        <Text>Ethereum's EIP-1559</Text>
      </Box>
      <EthereumNetworkBadge position="absolute" bottom="0" right="0" />
    </Box>
  )
}

export function Home() {
  const { details, blocks, session } = useBlockExplorer();

  if (!details) return <Loader>Loading block details ...</Loader>;

  if (!blocks) return <Loader>Loading blocks ...</Loader>;

  if (!session) return <Loader>Loading session ...</Loader>;

  const latestBlock = blocks[0];
  const renderedBlocks = blocks.slice(0, 5);

  return (
    <CurrencyProvider>
      <Center
        display="fixed"
        t="0"
        l="0"
        w="100%"
        h="100%"
        bg="brand.background"
        overflowY="auto"
      >
        <VStack
          zIndex={2}
          color="brand.primaryText"
          w={["95%", "90%", "700px"]}
          pb="100"
        >
          <Header />
          <TotalFeesCard totalBurned={details.totalBurned} />
          <SessionSummaryCard session={session} />
          <LatestBlocksCard latestBlock={latestBlock} renderedBlocks={renderedBlocks} />
          <Footer />
        </VStack>
        <FireAnimation />
      </Center>
    </CurrencyProvider>
  );
}
