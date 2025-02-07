import { log, BigInt } from '@graphprotocol/graph-ts';
import { Transfer as TransferEvent, USDC } from '../generated/USDC/USDC';
import { Token, Owner, Contract, Transfer } from '../generated/schema';
export function handleTransfer(event: TransferEvent): void {
  log.debug('Transfer detected. From: {} | To: {} | TokenID: {}', [
    event.params.from.toHexString(),
    event.params.to.toHexString(),
    event.address.toHexString(),
  ]);

  let sender = Owner.load(event.params.from.toHexString());
  let recipient = Owner.load(event.params.to.toHexString());
  let token = Token.load(event.address.toHexString());
  let transferId = event.transaction.hash
    .toHexString()
    .concat(':'.concat(event.transactionLogIndex.toHexString()));
  let transfer = Transfer.load(transferId);
  let contract = Contract.load(event.address.toHexString());
  let instance = USDC.bind(event.address);

  if (sender == null) {
    sender = new Owner(event.params.from.toHexString());

    sender.balance = BigInt.fromI32(0);
  } else {
    let prevBalance = sender.balance;
    if (prevBalance! > BigInt.fromI32(0)) {
        sender.balance = prevBalance - BigInt.fromString("1");
    }
  }

  if (recipient == null) {
    recipient = new Owner(event.params.to.toHexString());
    recipient.balance = BigInt.fromI32(1);
  } else {
    let prevBalance = recipient.balance;
    recipient.balance = prevBalance + BigInt.fromI32(1);
  }

  if (token == null) {
    token = new Token(event.address.toHexString());
    token.contract = event.address.toHexString();
  }

  token.owner = event.params.to.toHexString();

  if (transfer == null) {
    transfer = new Transfer(transferId);
    transfer.token = event.address.toHexString();
    transfer.from = event.params.from.toHexString();
    transfer.to = event.params.to.toHexString();
    transfer.timestamp = event.block.timestamp;
    transfer.block = event.block.number;
    transfer.transactionHash = event.transaction.hash.toHexString();
  }

  if (contract == null) {
    contract = new Contract(event.address.toHexString());
  }

  let name = instance.try_name();
  if (!name.reverted) {
    contract.name = name.value;
  }

  let symbol = instance.try_symbol();
  if (!symbol.reverted) {
    contract.symbol = symbol.value;
  }

  let totalSupply = instance.try_totalSupply();
  if (!totalSupply.reverted) {
    contract.totalSupply = totalSupply.value;
  }

  sender.save();
  recipient.save();
  token.save();
  contract.save();
  transfer.save();
}