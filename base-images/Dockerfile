FROM public.ecr.aws/lambda/nodejs:22

# Install Chromium and dependencies
RUN dnf update -y && \
    dnf install -y chromium \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN npm install chrome-aws-lambda
RUN npm install aws-sdk
RUN npm install puppeteer@10.1.0
RUN npm install puppeteer-core@10.1.0

CMD [ "index.handler" ]
