
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
    return transactions;
  }

  async generatePDF(transactions: any[], outputPath: string) {
    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);

    doc.fontSize(20).text('Transaction History Report', { align: 'center' });
    doc.moveDown();

    transactions.forEach((tx, index) => {
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
