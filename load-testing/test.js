import http from 'k6/http';
import { sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 50 },  // плавный рост до 50 пользователей
    { duration: '30s', target: 100 }, // увеличение до 100
    { duration: '30s', target: 200 }, // и до 200
  ],
};

export default function () {
  http.get('http://localhost:3001/api/todos');
  sleep(1);
}