FROM progrium/buildstep

RUN mkdir -p /app
ADD . /app
RUN /build/builder

ENV LCB_DATABASE_URI mongodb://db/letschat
EXPOSE 5000