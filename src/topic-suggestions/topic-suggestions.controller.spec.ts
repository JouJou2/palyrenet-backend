import { Test, TestingModule } from '@nestjs/testing';
import { TopicSuggestionsController } from './topic-suggestions.controller';

describe('TopicSuggestionsController', () => {
  let controller: TopicSuggestionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TopicSuggestionsController],
    }).compile();

    controller = module.get<TopicSuggestionsController>(TopicSuggestionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
