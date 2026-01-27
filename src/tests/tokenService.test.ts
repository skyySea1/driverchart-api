import { describe, it, expect, vi, beforeEach } from "vitest";
import { tokenService } from "../services/tokenService";
import { db } from "../services/firebaseService";
import dayjs from "dayjs";

// Mock Firebase
vi.mock("../services/firebaseService", () => ({
  db: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        set: vi.fn(),
        get: vi.fn(),
        update: vi.fn(),
      })),
    })),
  },
}));

describe("tokenService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateToken", () => {
    it("should generate a token and save it to firestore", async () => {
      const driverId = "driver-123";
      const docType = "license";
      
      const token = await tokenService.generateToken(driverId, docType);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(db.collection).toHaveBeenCalledWith(expect.stringContaining("upload_tokens"));
    });
  });

  describe("validateToken", () => {
    it("should return metadata for a valid token", async () => {
      const token = "valid-token";
      const mockData = {
        id: token,
        driverId: "driver-123",
        documentType: "license",
        createdAt: dayjs().toISOString(),
        expiresAt: dayjs().add(1, "hour").toISOString(),
        used: false,
      };

      // Mock get response
      const mockGet = vi.fn().mockResolvedValue({
        exists: true,
        data: () => mockData,
      });

      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: mockGet,
        }),
      });

      const result = await tokenService.validateToken(token);
      expect(result).toEqual(mockData);
    });

    it("should throw if token does not exist", async () => {
      const token = "invalid-token";
      
      const mockGet = vi.fn().mockResolvedValue({
        exists: false,
      });

      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: mockGet,
        }),
      });

      await expect(tokenService.validateToken(token)).rejects.toThrow("Invalid token");
    });

    it("should throw if token is expired", async () => {
      const token = "expired-token";
      const mockData = {
        id: token,
        driverId: "driver-123",
        documentType: "license",
        createdAt: dayjs().subtract(48, "hour").toISOString(),
        expiresAt: dayjs().subtract(1, "hour").toISOString(),
        used: false,
      };

      const mockGet = vi.fn().mockResolvedValue({
        exists: true,
        data: () => mockData,
      });

      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: mockGet,
        }),
      });

      await expect(tokenService.validateToken(token)).rejects.toThrow("Token expired");
    });

    it("should throw if token is already used", async () => {
      const token = "used-token";
      const mockData = {
        id: token,
        driverId: "driver-123",
        documentType: "license",
        createdAt: dayjs().toISOString(),
        expiresAt: dayjs().add(1, "hour").toISOString(),
        used: true,
      };

      const mockGet = vi.fn().mockResolvedValue({
        exists: true,
        data: () => mockData,
      });

      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: mockGet,
        }),
      });

      await expect(tokenService.validateToken(token)).rejects.toThrow("Token already used");
    });
  });

  describe("markTokenUsed", () => {
    it("should update the token as used", async () => {
      const token = "valid-token";
      const mockUpdate = vi.fn().mockResolvedValue({});

      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({
          update: mockUpdate,
        }),
      });

      await tokenService.markTokenUsed(token);
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        used: true,
        usedAt: expect.any(String)
      }));
    });
  });
});
