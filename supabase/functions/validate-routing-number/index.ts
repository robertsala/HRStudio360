import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RoutingNumberRequest {
  routingNumber: string;
}

interface BankInfo {
  routingNumber: string;
  bankName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  valid: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { routingNumber }: RoutingNumberRequest = await req.json();

    if (!routingNumber || routingNumber.length !== 9) {
      return new Response(
        JSON.stringify({
          error: "Routing number must be exactly 9 digits",
          valid: false,
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Validate routing number checksum using the ABA algorithm
    const isValidChecksum = validateRoutingNumberChecksum(routingNumber);

    if (!isValidChecksum) {
      return new Response(
        JSON.stringify({
          error: "Invalid routing number checksum",
          valid: false,
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Look up bank information from the Federal Reserve API
    const bankInfo = await lookupBankInfo(routingNumber);

    return new Response(
      JSON.stringify(bankInfo),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error validating routing number:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to validate routing number",
        valid: false,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

/**
 * Validates routing number using ABA checksum algorithm
 * Formula: 3(d1 + d4 + d7) + 7(d2 + d5 + d8) + (d3 + d6 + d9) mod 10 = 0
 */
function validateRoutingNumberChecksum(routingNumber: string): boolean {
  const digits = routingNumber.split("").map(Number);

  const sum =
    3 * (digits[0] + digits[3] + digits[6]) +
    7 * (digits[1] + digits[4] + digits[7]) +
    (digits[2] + digits[5] + digits[8]);

  return sum % 10 === 0;
}

/**
 * Looks up bank information using the FedACH directory
 * Uses the routingnumbers.info API which aggregates Federal Reserve data
 */
async function lookupBankInfo(routingNumber: string): Promise<BankInfo> {
  try {
    // Primary API: routingnumbers.info (free, no key required)
    const response = await fetch(
      `https://www.routingnumbers.info/api/name.json?rn=${routingNumber}`,
      {
        headers: {
          "User-Agent": "HRStudio360/1.0",
        },
      }
    );

    if (response.ok) {
      const data = await response.json();

      if (data.code === 200 && data.name) {
        return {
          routingNumber: routingNumber,
          bankName: data.name,
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          zip: data.zip || "",
          phone: data.phone || "",
          valid: true,
        };
      }
    }

    // Fallback: Try alternative API (OPTIONAL - only if API key is configured)
    const apiKey = Deno.env.get("API_APILAYER_KEY");
    if (apiKey && apiKey.trim() !== "") {
      const fallbackResponse = await fetch(
        `https://api.apilayer.com/bank_data/routing_number_bank_lookup?routing_number=${routingNumber}`,
        {
          headers: {
            "apikey": apiKey,
          },
        }
      ).catch(() => null);

      if (fallbackResponse && fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();

        if (fallbackData.bank_name) {
          return {
            routingNumber: routingNumber,
            bankName: fallbackData.bank_name,
            address: fallbackData.address || "",
            city: fallbackData.city || "",
            state: fallbackData.state || "",
            zip: fallbackData.zip || "",
            phone: fallbackData.phone || "",
            valid: true,
          };
        }
      }
    }

    // If APIs fail, use local database of major banks
    const localBankInfo = getLocalBankInfo(routingNumber);
    if (localBankInfo) {
      return localBankInfo;
    }
    
    // Routing number is valid (passed checksum) but bank info not found
    return {
      routingNumber: routingNumber,
      bankName: "Unknown Bank",
      address: "",
      city: "",
      state: "",
      zip: "",
      phone: "",
      valid: true,
    };
  } catch (error) {
    console.error("Error looking up bank info:", error);

    // Try local database as last resort
    const localBankInfo = getLocalBankInfo(routingNumber);
    if (localBankInfo) {
      return localBankInfo;
    }

    throw error;
  }
}

/**
 * Local database of major US banks (top 100 by routing number prefixes)
 * This ensures we can identify the most common banks even without API access
 */
function getLocalBankInfo(routingNumber: string): BankInfo | null {
  const majorBanks: Record<string, string> = {
    // Major National Banks
    "011000138": "Bank of America (New York)",
    "011000015": "Bank of America (Rhode Island)",
    "011200365": "Bank of America (Connecticut)",
    "021000021": "JPMorgan Chase Bank",
    "021000089": "Bank of America",
    "026009593": "Bank of America",
    "111000025": "Wells Fargo Bank",
    "121000248": "Wells Fargo Bank",
    "121042882": "Wells Fargo Bank",
    "021001088": "Citibank",
    "031101279": "The Bank of New York Mellon",
    "021200025": "State Street Bank",
    "011401533": "PNC Bank",
    "031000503": "U.S. Bank",
    "091000019": "U.S. Bank",
    "042000013": "BMO Harris Bank",
    "071000013": "Fifth Third Bank",
    "043000096": "PNC Bank",
    "053000196": "Fifth Third Bank",
    "063100277": "SunTrust Bank (Truist)",
    "061000104": "SunTrust Bank (Truist)",
    "053101121": "Truist Bank",
    "021000018": "JPMorgan Chase Bank",
    "267084131": "USAA Federal Savings Bank",
    "256074974": "Navy Federal Credit Union",
    "211370545": "TD Bank",
    "011600033": "TD Bank",
    "031201360": "Capital One",
    "051000017": "Capital One",
    "021000322": "Citibank",
    "322271627": "Chase Bank USA",
    "124000054": "Wells Fargo Bank",
    "102000076": "Wells Fargo Bank",
    "125008547": "Wells Fargo Bank",
    "041000124": "Bank of America",
    "031176110": "HSBC Bank USA",
    "122000247": "Wells Fargo Bank",
    "031000053": "Citibank",
    "122100024": "Ally Bank",
    "124003116": "American Express Bank",
    "031302955": "Barclays Bank Delaware",
    "124085244": "Discover Bank",
    "071000288": "BMO Harris Bank",
    "041215032": "Huntington National Bank",
    "044000024": "Fifth Third Bank",
    "074000010": "Key Bank",
    "125000024": "Key Bank",
    "102001017": "Wells Fargo Bank",
    "091000022": "Citibank",
  };

  const bankName = majorBanks[routingNumber];

  if (bankName) {
    return {
      routingNumber: routingNumber,
      bankName: bankName,
      address: "",
      city: "",
      state: "",
      zip: "",
      phone: "",
      valid: true,
    };
  }

  return null;
}
