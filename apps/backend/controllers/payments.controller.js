// controllers/payments.controller.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 🟢 Get all payments
export const getAllPayments = async (req, res) => {
  try {
    const { 
      include_relations = 'false',
      method,
      transactionId,
      branchId,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      page = 1,
      limit = 50 
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {
      ...(method && { method }),
      ...(transactionId && { transactionId }),
      ...(branchId && { 
        transaction: { branchId } 
      }),
      ...(minAmount && { amount: { gte: parseFloat(minAmount) } }),
      ...(maxAmount && { amount: { lte: parseFloat(maxAmount) } }),
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: include_relations === 'true' ? {
          transaction: {
            select: {
              id: true,
              receiptNumber: true,
              totalGross: true,
              status: true,
              createdAt: true,
              branch: {
                select: { id: true, name: true }
              },
              cashier: {
                select: { id: true, name: true }
              },
              customer: {
                select: { id: true, name: true, loyaltyNumber: true }
              }
            }
          }
        } : {
          transaction: {
            select: {
              id: true,
              receiptNumber: true,
              totalGross: true,
              status: true
            }
          }
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.payment.count({ where })
    ]);
    
    res.json({
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Error in getAllPayments:', err);
    res.status(500).json({ message: "Error fetching payments", error: err.message });
  }
};

// 🟢 Get payment by ID
export const getPaymentById = async (req, res) => {
  try {
    const { include_relations = 'false' } = req.query;
    
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: include_relations === 'true' ? {
        transaction: {
          include: {
            branch: { select: { id: true, name: true } },
            cashier: { select: { id: true, name: true } },
            customer: { 
              select: { id: true, name: true, phone: true, loyaltyNumber: true } 
            },
            lines: {
              select: {
                id: true,
                qty: true,
                unitPrice: true,
                lineTotal: true,
                product: {
                  select: { id: true, name: true, sku: true }
                }
              }
            },
            payments: {
              select: {
                id: true,
                method: true,
                amount: true,
                createdAt: true
              }
            }
          }
        }
      } : {
        transaction: {
          select: {
            id: true,
            receiptNumber: true,
            totalGross: true,
            status: true,
            createdAt: true
          }
        }
      }
    });
    
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    res.json(payment);
  } catch (err) {
    console.error('Error in getPaymentById:', err);
    res.status(500).json({ message: "Error fetching payment", error: err.message });
  }
};

// 🟢 Create payment
export const createPayment = async (req, res) => {
  try {
    const { transactionId, method, amount } = req.body;
    
    // Validate required fields
    if (!transactionId || !method || !amount) {
      return res.status(400).json({ 
        message: "Required fields: transactionId, method, amount" 
      });
    }
    
    // Validate payment method
    if (!['CASH', 'CARD', 'MOBILE'].includes(method)) {
      return res.status(400).json({ 
        message: "Payment method must be CASH, CARD, or MOBILE" 
      });
    }
    
    // Validate amount
    const paymentAmount = parseFloat(amount);
    if (paymentAmount <= 0) {
      return res.status(400).json({ 
        message: "Payment amount must be greater than 0" 
      });
    }
    
    // Validate transaction exists
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        payments: true
      }
    });
    
    if (!transaction) {
      return res.status(400).json({ message: "Transaction not found" });
    }
    
    // Check if transaction is still pending (can't add payments to completed transactions)
    if (transaction.status === 'COMPLETED') {
      return res.status(400).json({ 
        message: "Cannot add payments to completed transaction" 
      });
    }
    
    // Calculate total payments so far
    const totalPaid = transaction.payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const transactionTotal = parseFloat(transaction.totalGross);
    
    // Check if adding this payment would exceed transaction total
    if (totalPaid + paymentAmount > transactionTotal + 0.01) { // Allow 1 cent tolerance
      return res.status(400).json({ 
        message: `Payment amount exceeds remaining balance. Total: ${transactionTotal}, Paid: ${totalPaid}, Remaining: ${(transactionTotal - totalPaid).toFixed(2)}` 
      });
    }
    
    const newPayment = await prisma.payment.create({
      data: {
        transactionId,
        method,
        amount: paymentAmount
      },
      include: {
        transaction: {
          select: {
            id: true,
            receiptNumber: true,
            totalGross: true,
            status: true
          }
        }
      }
    });
    
    // Check if transaction is now fully paid
    const newTotalPaid = totalPaid + paymentAmount;
    if (Math.abs(newTotalPaid - transactionTotal) <= 0.01) {
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'COMPLETED' }
      });
    }
    
    res.status(201).json(newPayment);
  } catch (err) {
    console.error('Error in createPayment:', err);
    res.status(500).json({ message: "Error creating payment", error: err.message });
  }
};

// 🟢 Update payment (limited - only amount for corrections)
export const updatePayment = async (req, res) => {
  try {
    const { amount } = req.body;
    
    // Check if payment exists
    const existingPayment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: {
        transaction: {
          include: {
            payments: true
          }
        }
      }
    });
    
    if (!existingPayment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    
    // Can't update payments for completed transactions
    if (existingPayment.transaction.status === 'COMPLETED') {
      return res.status(400).json({ 
        message: "Cannot update payments for completed transaction" 
      });
    }
    
    if (amount !== undefined) {
      const newAmount = parseFloat(amount);
      if (newAmount <= 0) {
        return res.status(400).json({ 
          message: "Payment amount must be greater than 0" 
        });
      }
      
      // Calculate total payments excluding this one
      const otherPaymentsTotal = existingPayment.transaction.payments
        .filter(p => p.id !== req.params.id)
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);
      
      const transactionTotal = parseFloat(existingPayment.transaction.totalGross);
      
      // Check if new amount would exceed transaction total
      if (otherPaymentsTotal + newAmount > transactionTotal + 0.01) {
        return res.status(400).json({ 
          message: `Payment amount exceeds transaction total. Total: ${transactionTotal}, Other payments: ${otherPaymentsTotal}` 
        });
      }
    }
    
    const updatedPayment = await prisma.payment.update({
      where: { id: req.params.id },
      data: {
        ...(amount !== undefined && { amount: parseFloat(amount) })
      },
      include: {
        transaction: {
          select: {
            id: true,
            receiptNumber: true,
            totalGross: true,
            status: true
          }
        }
      }
    });
    
    res.json(updatedPayment);
  } catch (err) {
    console.error('Error in updatePayment:', err);
    res.status(500).json({ message: "Error updating payment", error: err.message });
  }
};

// 🟢 Delete payment
export const deletePayment = async (req, res) => {
  try {
    // Check if payment exists
    const existingPayment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: {
        transaction: {
          select: {
            id: true,
            status: true,
            receiptNumber: true
          }
        }
      }
    });

    if (!existingPayment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Can't delete payments from completed transactions
    if (existingPayment.transaction.status === 'COMPLETED') {
      return res.status(400).json({ 
        message: "Cannot delete payments from completed transaction. Use returns instead." 
      });
    }

    await prisma.payment.delete({
      where: { id: req.params.id }
    });
    
    res.json({ message: "Payment deleted successfully" });
  } catch (err) {
    console.error('Error in deletePayment:', err);
    res.status(500).json({ message: "Error deleting payment", error: err.message });
  }
};

// 🆕 Get payments by transaction
export const getPaymentsByTransaction = async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { transactionId: req.params.transactionId },
      orderBy: { createdAt: 'asc' }
    });
    
    // Calculate payment summary
    const summary = {
      totalPaid: payments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
      paymentCount: payments.length,
      methods: [...new Set(payments.map(p => p.method))],
      methodBreakdown: {}
    };
    
    // Group by payment method
    payments.forEach(payment => {
      const method = payment.method;
      if (!summary.methodBreakdown[method]) {
        summary.methodBreakdown[method] = {
          count: 0,
          total: 0
        };
      }
      summary.methodBreakdown[method].count++;
      summary.methodBreakdown[method].total += parseFloat(payment.amount);
    });
    
    res.json({
      payments,
      summary
    });
  } catch (err) {
    console.error('Error in getPaymentsByTransaction:', err);
    res.status(500).json({ message: "Error fetching transaction payments", error: err.message });
  }
};

// 🆕 Process multiple payments for a transaction
export const processMultiplePayments = async (req, res) => {
  try {
    const { transactionId, payments } = req.body;
    
    if (!transactionId || !payments || !Array.isArray(payments) || payments.length === 0) {
      return res.status(400).json({ 
        message: "Required fields: transactionId, payments (array)" 
      });
    }
    
    // Validate transaction exists
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { payments: true }
    });
    
    if (!transaction) {
      return res.status(400).json({ message: "Transaction not found" });
    }
    
    if (transaction.status === 'COMPLETED') {
      return res.status(400).json({ 
        message: "Cannot add payments to completed transaction" 
      });
    }
    
    // Validate each payment
    let totalNewPayments = 0;
    for (const payment of payments) {
      if (!payment.method || !payment.amount) {
        return res.status(400).json({ 
          message: "Each payment must have method and amount" 
        });
      }
      
      if (!['CASH', 'CARD', 'MOBILE'].includes(payment.method)) {
        return res.status(400).json({ 
          message: "Payment method must be CASH, CARD, or MOBILE" 
        });
      }
      
      const amount = parseFloat(payment.amount);
      if (amount <= 0) {
        return res.status(400).json({ 
          message: "All payment amounts must be greater than 0" 
        });
      }
      
      totalNewPayments += amount;
    }
    
    // Check total doesn't exceed transaction amount
    const existingTotal = transaction.payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const transactionTotal = parseFloat(transaction.totalGross);
    
    if (existingTotal + totalNewPayments > transactionTotal + 0.01) {
      return res.status(400).json({ 
        message: `Total payments exceed transaction amount. Transaction: ${transactionTotal}, Existing: ${existingTotal}, New: ${totalNewPayments}` 
      });
    }
    
    // Process all payments in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const createdPayments = [];
      
      for (const payment of payments) {
        const newPayment = await tx.payment.create({
          data: {
            transactionId,
            method: payment.method,
            amount: parseFloat(payment.amount)
          }
        });
        createdPayments.push(newPayment);
      }
      
      // Check if transaction should be marked as completed
      const finalTotal = existingTotal + totalNewPayments;
      if (Math.abs(finalTotal - transactionTotal) <= 0.01) {
        await tx.transaction.update({
          where: { id: transactionId },
          data: { status: 'COMPLETED' }
        });
      }
      
      return createdPayments;
    });
    
    res.status(201).json({
      payments: result,
      summary: {
        totalProcessed: totalNewPayments,
        paymentCount: result.length,
        transactionStatus: Math.abs(existingTotal + totalNewPayments - transactionTotal) <= 0.01 ? 'COMPLETED' : 'PENDING'
      }
    });
  } catch (err) {
    console.error('Error in processMultiplePayments:', err);
    res.status(500).json({ message: "Error processing payments", error: err.message });
  }
};

// 🆕 Get payment analytics
export const getPaymentAnalytics = async (req, res) => {
  try {
    const { 
      branchId,
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate = new Date().toISOString()
    } = req.query;
    
    const where = {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      },
      ...(branchId && { 
        transaction: { branchId } 
      })
    };
    
    const [
      totalPayments,
      paymentsByMethod,
      averagePayment,
      paymentVolumeByDay
    ] = await Promise.all([
      prisma.payment.aggregate({
        where,
        _sum: { amount: true },
        _count: true
      }),
      prisma.payment.groupBy({
        by: ['method'],
        where,
        _sum: { amount: true },
        _count: true
      }),
      prisma.payment.aggregate({
        where,
        _avg: { amount: true }
      }),
      prisma.payment.groupBy({
        by: ['createdAt'],
        where,
        _sum: { amount: true },
        _count: true
      })
    ]);
    
    // Process daily data (group by date only, not time)
    const dailyData = {};
    paymentVolumeByDay.forEach(item => {
      const date = item.createdAt.toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { date, amount: 0, count: 0 };
      }
      dailyData[date].amount += parseFloat(item._sum.amount);
      dailyData[date].count += item._count;
    });
    
    const dailyVolume = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
    
    res.json({
      period: {
        startDate,
        endDate
      },
      overview: {
        totalAmount: totalPayments._sum.amount ? parseFloat(totalPayments._sum.amount) : 0,
        totalCount: totalPayments._count,
        averageAmount: averagePayment._avg.amount ? parseFloat(averagePayment._avg.amount) : 0
      },
      methodBreakdown: paymentsByMethod.map(method => ({
        method: method.method,
        amount: parseFloat(method._sum.amount),
        count: method._count,
        percentage: totalPayments._sum.amount 
          ? ((parseFloat(method._sum.amount) / parseFloat(totalPayments._sum.amount)) * 100).toFixed(2)
          : 0
      })),
      dailyVolume
    });
  } catch (err) {
    console.error('Error in getPaymentAnalytics:', err);
    res.status(500).json({ message: "Error fetching payment analytics", error: err.message });
  }
};