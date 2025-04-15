const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();

    const response = await fetch('https://api.mathpix.com/v3/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'app_id': Deno.env.get('MATHPIX_APP_ID') ?? '',
        'app_key': Deno.env.get('MATHPIX_APP_KEY') ?? '',
      },
      body: JSON.stringify({
        src: `data:image/jpeg;base64,${image}`,
        formats: ['text', 'latex_styled'],
        data_options: {
          include_latex: true,
          include_asciimath: true,
        },
      }),
    });

    const data = await response.json();

    return new Response(
      JSON.stringify({
        text: data.text,
        latex_styled: data.latex_styled,
        confidence: data.confidence || 0.8,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      },
    );
  }
});