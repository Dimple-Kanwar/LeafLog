import { log } from '@graphprotocol/graph-ts';
import { Transfer as TransferEvent, ERC20 } from '../generated/ERC20/ERC20';
import { Token, Transfer } from '../generated/schema';

export function handleTransfer(event: TransferEvent): void {
  log.debug('Transfer detected. From: {} | To: {} | TokenID: {}', [
    event.params.from.toHexString(),
    event.params.to.toHexString(),
    event.address.toHexString(),
  ]);

  // build token schema
  let token = Token.load(event.address.toHexString());
  if (token == null) {
    token = new Token(event.address.toHexString());
  }
  let instance = ERC20.bind(event.address);
  let name = instance.try_name();
  if (!name.reverted) {
    token.name = name.value;
  }

  let symbol = instance.try_symbol();
  if (!symbol.reverted) {
    token.symbol = symbol.value;
  }

  // build transfer schema
  let transferId = event.transaction.hash
  .toHexString()
  .concat(':'.concat(event.transactionLogIndex.toHexString()));
  let transfer = Transfer.load(transferId);
  if (transfer == null) {
    transfer = new Transfer(transferId);
    transfer.token = event.address.toHexString();
    transfer.tokenSymbol = symbol.value;
    transfer.amount = event.params.value;
    transfer.sender = event.params.from.toHexString();
    transfer.recipient = event.params.to.toHexString();
    transfer.timestamp = event.block.timestamp;
    transfer.block = event.block.number;
    transfer.transactionHash = event.transaction.hash.toHexString();
  }

  // save data
  token.save();
  transfer.save();
}