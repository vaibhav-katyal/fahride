import { customAlphabet } from "nanoid";
import { Types } from "mongoose";
import { UserModel } from "../models/User.model.js";
import { WalletRedemptionModel } from "../models/WalletRedemption.model.js";
import { WalletTransactionModel } from "../models/WalletTransaction.model.js";

const WEEKLY_POINTS_CAP = 100;
const FIRST_DAY_LIMIT_HOURS = 24;
const REFERRAL_REWARD_LIMIT = 3;
const REFERRAL_CODE_ALPHABET = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

export const MIN_JOIN_LEAD_MINUTES = 30;
export const REDEMPTION_POINTS_UNIT = 500;
export const REDEMPTION_RUPEES_PER_UNIT = 50;

export type WalletRewardKind =
  | "signup_bonus"
  | "ride_post_reward"
  | "ride_join_reward"
  | "feedback_reward"
  | "referral_invite_bonus"
  | "referral_signup_friend_bonus"
  | "referral_first_join_inviter_bonus"
  | "referral_first_join_friend_bonus";

type GrantPointsInput = {
  userId: string;
  kind: WalletRewardKind;
  points: number;
  now?: Date;
  idempotencyKey?: string;
  rideId?: string;
  requestId?: string;
  feedbackId?: string;
  relatedUserId?: string;
  note?: string;
  enforceDailyLimit?: "ride_post" | "ride_join" | "feedback";
  bypassFirstDayLimit?: boolean;
  bypassWeeklyCap?: boolean;
};

const startOfDay = (date: Date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
};

const endOfDay = (date: Date) => {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
};

const startOfWeek = (date: Date) => {
  const start = new Date(date);
  const mondayOffset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - mondayOffset);
  start.setHours(0, 0, 0, 0);
  return start;
};

const endOfWeek = (date: Date) => {
  const end = startOfWeek(date);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

const getPositivePointsInRange = async (userId: string, from: Date, to: Date) => {
  const [result] = await WalletTransactionModel.aggregate<{ total: number }>([
    {
      $match: {
        user: new Types.ObjectId(userId),
        pointsDelta: { $gt: 0 },
        reversedAt: { $exists: false },
        createdAt: { $gte: from, $lte: to },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$pointsDelta" },
      },
    },
  ]);

  return result?.total ?? 0;
};

const getDailyRewardCount = async (
  userId: string,
  day: Date,
  kind: "ride_post_reward" | "ride_join_reward" | "feedback_reward"
) => {
  return WalletTransactionModel.countDocuments({
    user: userId,
    kind,
    pointsDelta: { $gt: 0 },
    reversedAt: { $exists: false },
    createdAt: { $gte: startOfDay(day), $lte: endOfDay(day) },
  });
};

const getFirstDayRewardCount = async (userId: string, createdAt: Date, now: Date) => {
  return WalletTransactionModel.countDocuments({
    user: userId,
    kind: { $ne: "signup_bonus" },
    pointsDelta: { $gt: 0 },
    reversedAt: { $exists: false },
    createdAt: { $gte: createdAt, $lte: now },
  });
};

const grantPoints = async (input: GrantPointsInput) => {
  if (input.points <= 0) {
    return { awarded: false as const, reason: "invalid_points" as const };
  }

  const now = input.now ?? new Date();
  const user = await UserModel.findById(input.userId).select("_id createdAt");
  if (!user) {
    return { awarded: false as const, reason: "user_not_found" as const };
  }

  if (!input.bypassFirstDayLimit) {
    const accountAgeMs = now.getTime() - user.createdAt.getTime();
    if (accountAgeMs < FIRST_DAY_LIMIT_HOURS * 60 * 60 * 1000) {
      const firstDayRewards = await getFirstDayRewardCount(input.userId, user.createdAt, now);
      if (firstDayRewards >= 1) {
        return { awarded: false as const, reason: "first_day_limit_reached" as const };
      }
    }
  }

  if (!input.bypassWeeklyCap) {
    const earnedThisWeek = await getPositivePointsInRange(input.userId, startOfWeek(now), endOfWeek(now));
    if (earnedThisWeek + input.points > WEEKLY_POINTS_CAP) {
      return { awarded: false as const, reason: "weekly_cap_reached" as const };
    }
  }

  if (input.enforceDailyLimit === "ride_post") {
    const postRewardsToday = await getDailyRewardCount(input.userId, now, "ride_post_reward");
    if (postRewardsToday >= 1) {
      return { awarded: false as const, reason: "daily_post_limit_reached" as const };
    }
  }

  if (input.enforceDailyLimit === "ride_join") {
    const joinRewardsToday = await getDailyRewardCount(input.userId, now, "ride_join_reward");
    if (joinRewardsToday >= 1) {
      return { awarded: false as const, reason: "daily_join_limit_reached" as const };
    }
  }

  if (input.enforceDailyLimit === "feedback") {
    const feedbackRewardsToday = await getDailyRewardCount(input.userId, now, "feedback_reward");
    if (feedbackRewardsToday >= 1) {
      return { awarded: false as const, reason: "daily_feedback_limit_reached" as const };
    }
  }

  try {
    const transaction = await WalletTransactionModel.create({
      user: input.userId,
      kind: input.kind,
      pointsDelta: input.points,
      idempotencyKey: input.idempotencyKey,
      ride: input.rideId,
      request: input.requestId,
      feedbackId: input.feedbackId,
      relatedUser: input.relatedUserId,
      note: input.note ?? "",
    });

    await UserModel.updateOne(
      { _id: input.userId },
      {
        $inc: {
          walletPoints: input.points,
          walletLifetimeEarned: input.points,
        },
      }
    );

    return { awarded: true as const, transactionId: String(transaction._id) };
  } catch (error) {
    const duplicateKeyError =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: number }).code === 11000;

    if (duplicateKeyError) {
      return { awarded: false as const, reason: "duplicate" as const };
    }

    throw error;
  }
};

export const generateUniqueReferralCode = async () => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = REFERRAL_CODE_ALPHABET();
    const exists = await UserModel.exists({ referralCode: code });
    if (!exists) {
      return code;
    }
  }

  throw new Error("Unable to generate unique referral code");
};

export const awardSignupPoints = async (userId: string) => {
  return grantPoints({
    userId,
    kind: "signup_bonus",
    points: 5,
    idempotencyKey: `signup:${userId}`,
    bypassFirstDayLimit: true,
    bypassWeeklyCap: true,
  });
};

export const awardReferralInviteBonus = async (inviterId: string, friendUserId: string) => {
  const inviter = await UserModel.findById(inviterId).select("_id referralInviteRewardsCount");
  if (!inviter || inviter.referralInviteRewardsCount >= REFERRAL_REWARD_LIMIT) {
    return { awarded: false as const };
  }

  const result = await grantPoints({
    userId: inviterId,
    kind: "referral_invite_bonus",
    points: 20,
    relatedUserId: friendUserId,
    idempotencyKey: `referral-invite:${inviterId}:${friendUserId}`,
    bypassFirstDayLimit: true,
  });

  if (result.awarded) {
    await UserModel.updateOne(
      { _id: inviterId },
      {
        $inc: { referralInviteRewardsCount: 1 },
      }
    );
  }

  return result;
};

export const awardReferralSignupFriendBonus = async (friendUserId: string, inviterId: string) => {
  return grantPoints({
    userId: friendUserId,
    kind: "referral_signup_friend_bonus",
    points: 10,
    relatedUserId: inviterId,
    idempotencyKey: `referral-signup-friend:${friendUserId}`,
    bypassFirstDayLimit: true,
  });
};

export const awardRideApprovalPoints = async (
  driverId: string,
  passengerId: string,
  rideId: string,
  requestId: string
) => {
  await grantPoints({
    userId: driverId,
    kind: "ride_post_reward",
    points: 20,
    rideId,
    requestId,
    idempotencyKey: `ride-post:${driverId}:${requestId}`,
    enforceDailyLimit: "ride_post",
    bypassFirstDayLimit: true,
  });

  const joinReward = await grantPoints({
    userId: passengerId,
    kind: "ride_join_reward",
    points: 10,
    rideId,
    requestId,
    idempotencyKey: `ride-join:${passengerId}:${requestId}`,
    enforceDailyLimit: "ride_join",
    bypassFirstDayLimit: true,
  });

  const passenger = await UserModel.findById(passengerId).select("referredBy firstJoinBonusGranted");
  if (!passenger || passenger.firstJoinBonusGranted || !passenger.referredBy) {
    return joinReward;
  }

  await grantPoints({
    userId: String(passenger.referredBy),
    kind: "referral_first_join_inviter_bonus",
    points: 10,
    relatedUserId: passengerId,
    idempotencyKey: `referral-first-inviter:${String(passenger.referredBy)}:${passengerId}`,
    bypassFirstDayLimit: true,
  });

  await grantPoints({
    userId: passengerId,
    kind: "referral_first_join_friend_bonus",
    points: 10,
    relatedUserId: String(passenger.referredBy),
    idempotencyKey: `referral-first-friend:${passengerId}`,
    bypassFirstDayLimit: true,
  });

  await UserModel.updateOne(
    { _id: passengerId },
    {
      $set: { firstJoinBonusGranted: true },
    }
  );

  return joinReward;
};

export const awardFeedbackPoints = async (userId: string, rideId: string, feedbackId: string) => {
  return grantPoints({
    userId,
    kind: "feedback_reward",
    points: 1,
    rideId,
    feedbackId,
    idempotencyKey: `feedback:${userId}:${feedbackId}`,
    enforceDailyLimit: "feedback",
  });
};

export const reverseRideApprovalPointsOnCancel = async (requestId: string, cancelledByUserId: string) => {
  const originalRewards = await WalletTransactionModel.find({
    request: requestId,
    kind: { $in: ["ride_post_reward", "ride_join_reward"] },
    reversedAt: { $exists: false },
    pointsDelta: { $gt: 0 },
  });

  for (const reward of originalRewards) {
    const reversalKey = `reversal:${String(reward._id)}`;

    const reversalExists = await WalletTransactionModel.exists({ idempotencyKey: reversalKey });
    if (reversalExists) {
      continue;
    }

    await WalletTransactionModel.create({
      user: reward.user,
      kind: "reversal_adjustment",
      pointsDelta: -reward.pointsDelta,
      idempotencyKey: reversalKey,
      ride: reward.ride,
      request: reward.request,
      relatedUser: cancelledByUserId,
      note: `Reversed due to booking cancellation for request ${requestId}`,
    });

    await UserModel.updateOne(
      { _id: reward.user },
      {
        $inc: {
          walletPoints: -reward.pointsDelta,
        },
      }
    );

    reward.reversedAt = new Date();
    await reward.save();
  }
};

export const getWalletOverview = async (userId: string) => {
  let user = await UserModel.findById(userId)
    .select("walletPoints walletLifetimeEarned referralCode referralInviteRewardsCount createdAt")
    .lean();
  if (!user) {
    return null;
  }

  if (!user.referralCode) {
    const generatedReferralCode = await generateUniqueReferralCode();
    await UserModel.updateOne(
      { _id: userId },
      {
        $set: { referralCode: generatedReferralCode },
      }
    );

    user = {
      ...user,
      referralCode: generatedReferralCode,
    };
  }

  const [transactions, pendingRedemptions, weeklyEarned, todayJoinRewards, todayPostRewards] = await Promise.all([
    WalletTransactionModel.find({ user: userId }).sort({ createdAt: -1 }).limit(20).lean(),
    WalletRedemptionModel.countDocuments({ user: userId, status: "pending" }),
    getPositivePointsInRange(userId, startOfWeek(new Date()), endOfWeek(new Date())),
    getDailyRewardCount(userId, new Date(), "ride_join_reward"),
    getDailyRewardCount(userId, new Date(), "ride_post_reward"),
  ]);

  return {
    balance: user.walletPoints ?? 0,
    lifetimeEarned: user.walletLifetimeEarned ?? 0,
    weeklyEarned,
    weeklyCap: WEEKLY_POINTS_CAP,
    weeklyLimitReached: weeklyEarned >= WEEKLY_POINTS_CAP,
    daily: {
      joinRewardsUsed: todayJoinRewards,
      joinRewardsLimit: 1,
      postRewardsUsed: todayPostRewards,
      postRewardsLimit: 1,
    },
    referral: {
      code: user.referralCode || "",
      invitesRewarded: user.referralInviteRewardsCount ?? 0,
      maxInviteRewards: REFERRAL_REWARD_LIMIT,
    },
    redemption: {
      pointsPerUnit: REDEMPTION_POINTS_UNIT,
      rupeesPerUnit: REDEMPTION_RUPEES_PER_UNIT,
      pendingRequests: pendingRedemptions,
    },
    transactions: transactions.map((item) => ({
      id: String(item._id),
      kind: item.kind,
      pointsDelta: item.pointsDelta,
      rideId: item.ride ? String(item.ride) : "",
      requestId: item.request ? String(item.request) : "",
      note: item.note || "",
      createdAt: item.createdAt,
      reversedAt: item.reversedAt,
    })),
  };
};

export const requestWalletRedemption = async (userId: string, points: number, upiId: string) => {
  const user = await UserModel.findById(userId).select("walletPoints");
  if (!user) {
    return null;
  }

  if (user.walletPoints < points) {
    return { error: "insufficient_points" as const };
  }

  const rupeesAmount = (points / REDEMPTION_POINTS_UNIT) * REDEMPTION_RUPEES_PER_UNIT;

  const redemption = await WalletRedemptionModel.create({
    user: userId,
    upiId,
    pointsSpent: points,
    rupeesAmount,
    status: "pending",
  });

  await WalletTransactionModel.create({
    user: userId,
    kind: "redemption_debit",
    pointsDelta: -points,
    idempotencyKey: `redeem:${userId}:${String(redemption._id)}`,
    note: `Redemption requested for Rs ${rupeesAmount} to ${upiId}`,
  });

  await UserModel.updateOne(
    { _id: userId },
    {
      $inc: {
        walletPoints: -points,
      },
    }
  );

  return {
    id: String(redemption._id),
    pointsSpent: points,
    rupeesAmount,
    status: redemption.status,
    createdAt: redemption.createdAt,
  };
};
