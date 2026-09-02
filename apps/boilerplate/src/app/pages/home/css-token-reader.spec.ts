import { TestBed } from '@angular/core/testing';
import { CssTokenReader } from './css-token-reader';
import { MOCK_TOKEN_NAME, MOCK_TOKEN_VALUE, MOCK_UNDECLARED_TOKEN_NAME } from './css-token-reader.mock';

describe('CssTokenReader', () => {
  let reader: CssTokenReader;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    reader = TestBed.inject(CssTokenReader);
    document.body.style.setProperty(MOCK_TOKEN_NAME, MOCK_TOKEN_VALUE);
  });

  afterEach(() => {
    document.body.style.removeProperty(MOCK_TOKEN_NAME);
  });

  it('reads a token declared on the body, which is where a theme lands', () => {
    expect(reader.read(MOCK_TOKEN_NAME)).toBe(MOCK_TOKEN_VALUE);
  });

  it('reports an empty string for a token nothing declares', () => {
    expect(reader.read(MOCK_UNDECLARED_TOKEN_NAME)).toBe('');
  });

  it('trims the whitespace a declaration may carry', () => {
    document.body.style.setProperty(MOCK_TOKEN_NAME, `  ${MOCK_TOKEN_VALUE}  `);

    expect(reader.read(MOCK_TOKEN_NAME)).toBe(MOCK_TOKEN_VALUE);
  });
});
