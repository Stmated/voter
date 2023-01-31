import fetch, {Headers} from 'node-fetch';

interface GisOptions {
  searchTerm: string;
  queryStringAddition?: string;
  filterOutDomains?: string[];
}

export interface ImageReference {
  url: string,
  width: number,
  height: number
}

export class ImageDownloader {

  private readonly baseURL = 'http://images.google.com/search?';
  private readonly imageFileExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'];

  search(opts: string | GisOptions): Promise<string[]> {

    const url = '';

    return fetch(url, {
      headers: new Headers({
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36'
      })
    })
      .then(response => response.text())
      .then(body => {

        return [] as string[];
      })
    ;
  }
}
