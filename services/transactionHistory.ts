
import Web3 from 'web3';
import PDFDocument from 'pdfkit';
import nodemailer from 'nodemailer';
import * as fs from 'fs';

export class TransactionHistoryService {
  private web3: Web3;

  constructor(rpcUrl: string) {
    this.web3 = new Web3(rpcUrl);
  }

  async getTransactions(address: string, fromBlock: number, toBlock: number) {
    const transactions = await this.web3.eth.getPastLogs({
      fromBlock,
      toBlock,
      address
    });
    
    // Check for NFT transfers (ERC721/ERC1155) and token airdrops
    const nftTransfers = transactions.filter((tx: any) => 
      tx.topics && (
        tx.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' || // ERC721
        tx.topics[0] === '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62'    // ERC1155
      )
    );
    
    const airdrops = transactions.filter((tx: any) =>
      tx.topics && tx.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' && // ERC20
      tx.topics[1] === '0x0000000000000000000000000000000000000000000000000000000000000000'      // From zero address
    );

    return {
      transactions,
      nftTransfers,
      airdrops
    };
  }

  async generatePDF(data: { transactions: any[], nftTransfers: any[], airdrops: any[] }, outputPath: string) {
    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);

    doc.fontSize(20).text('Transaction History Report', { align: 'center' });
    doc.moveDown();

    // NFT Transfers section
    if (data.nftTransfers.length > 0) {
      doc.fontSize(16).text('NFT Transfers', { align: 'left' });
      data.nftTransfers.forEach((tx, index) => {
        doc.fontSize(12).text(`NFT Transfer ${index + 1}:`);
        doc.fontSize(10)
          .text(`Hash: ${tx.transactionHash}`)
          .text(`Block: ${tx.blockNumber}`)
          .text(`Contract: ${tx.address}`);
        doc.moveDown();
      });
    }

    // Airdrops section
    if (data.airdrops.length > 0) {
      doc.fontSize(16).text('Token Airdrops', { align: 'left' });
      data.airdrops.forEach((tx, index) => {
        doc.fontSize(12).text(`Airdrop ${index + 1}:`);
        doc.fontSize(10)
          .text(`Hash: ${tx.transactionHash}`)
          .text(`Block: ${tx.blockNumber}`)
          .text(`Token Contract: ${tx.address}`);
        doc.moveDown();
      });
    }

    // Regular transactions
    doc.fontSize(16).text('Other Transactions', { align: 'left' });
    data.transactions.forEach((tx, index) => {
      doc.fontSize(12).text(`Transaction ${index + 1}:`);
      doc.fontSize(10)
        .text(`Hash: ${tx.transactionHash}`)
        .text(`Block: ${tx.blockNumber}`)
        .text(`From: ${tx.from}`)
        .text(`To: ${tx.to}`)
        .text(`Value: ${this.web3.utils.fromWei(tx.value || '0', 'ether')} ETH`);
      doc.moveDown();
    });

    doc.end();
    return new Promise((resolve) => writeStream.on('finish', resolve));
  }

  async emailPDF(filePath: string, emailAddress: string) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: emailAddress,
      subject: 'Transaction History Report',
      text: 'Please find your transaction history report attached.',
      attachments: [{
        filename: 'transaction_history.pdf',
        path: filePath
      }]
    });
  }
}
