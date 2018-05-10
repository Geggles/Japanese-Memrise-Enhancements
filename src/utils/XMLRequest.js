import SemiPromise from './semiPromise';

export default (openArgs, sendArgs=[]) => new SemiPromise((resolve, reject) => {
  const request = new XMLHttpRequest();
  request.addEventListener('load', () => (request.status === 200? resolve: reject)(request.response));
  request.open(...openArgs);
  request.send(...sendArgs);
});
