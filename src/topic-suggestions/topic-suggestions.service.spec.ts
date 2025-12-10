import { Test, TestingModule } from '@nestjs/testing';
import { TopicSuggestionsService } from './topic-suggestions.service';

describe('TopicSuggestionsService', () => {
  let service: TopicSuggestionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TopicSuggestionsService],
    }).compile();

    service = module.get<TopicSuggestionsService>(TopicSuggestionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
