import { Test, TestingModule } from '@nestjs/testing';
import { ApplicantGateway } from '../applicant.gateway';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

describe('ApplicantGateway', () => {
  let gateway: ApplicantGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicantGateway,
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    gateway = module.get<ApplicantGateway>(ApplicantGateway);
    gateway.server = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as unknown as Server;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should log connection', () => {
      const mockClient = {
        id: 'test-client',
        disconnect: jest.fn(),
      } as unknown as Socket;
      gateway.handleConnection(mockClient);
      // Since it just logs, we just ensure it doesn't throw and coverage hits the line
    });

    it('should disconnect on error (simulated)', () => {
      const mockClient = {
        id: 'test-client',
        disconnect: jest.fn(),
        get something() {
          throw new Error('Test error');
        },
      } as unknown as Socket;

      // Replace logger to throw and catch disconnect
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      jest.spyOn((gateway as any).logger, 'log').mockImplementation(() => {
        throw new Error('error');
      });
      gateway.handleConnection(mockClient);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockClient.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('should log disconnection', () => {
      const mockClient = { id: 'test-client' } as unknown as Socket;
      gateway.handleDisconnect(mockClient);
    });
  });

  describe('handleJoinRoom', () => {
    it('should join the applicant room', () => {
      const mockClient = {
        id: 'test-client',
        join: jest.fn(),
      } as unknown as Socket;
      gateway.handleJoinRoom(mockClient, '123');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockClient.join).toHaveBeenCalledWith('applicant_123');
    });
  });

  describe('notifyStatusUpdate', () => {
    it('should emit statusUpdate event to specific applicant room', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = { statusId: 2 } as any;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      gateway.notifyStatusUpdate('123', payload);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(gateway.server.to).toHaveBeenCalledWith('applicant_123');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(gateway.server.to('applicant_123').emit).toHaveBeenCalledWith(
        'statusUpdate',

        payload,
      );
    });
  });
});
