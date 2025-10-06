exports.handler = async function(event){
  if (event.httpMethod !== 'GET'){
    return { statusCode: 405, body: JSON.stringify({ success:false, message:'Method not allowed' }) };
  }
  const params = event.queryStringParameters || {};
  const code = params.c || '';
  if (code){
    return { statusCode: 302, headers: { Location: `/?c=${encodeURIComponent(code)}` } };
  }
  return { statusCode: 302, headers: { Location: '/' } };
} 